import { useEffect, useRef, useState } from 'react'
import { Accidental, Formatter, Renderer, Stave, StaveNote, Voice } from 'vexflow'
import {
  createQuestion,
  createMasterQuestion,
  createQualityQuestion,
  intervalNames,
  intervalOptions,
  masterIntervalNames,
  masterIntervalOptions,
  masterQualityOptions,
  qualityNames,
  qualityOptionsFor,
  type IntervalNumber,
  type Note,
  type IntervalQuality,
  type IntervalQuestion,
  type MasterIntervalAnswer,
  type MasterQuestion,
  type QualityQuestion,
} from './domain'

type Screen = 'home' | 'training' | 'quality-training' | 'master-training'
type Feedback = { correct: boolean; selected: IntervalNumber }
type QualityFeedback =
  | { step: 'interval'; correct: boolean; selected: IntervalNumber }
  | { step: 'quality'; correct: boolean; selected: IntervalQuality }

function createStaveNote(source: Note) {
  const note = new StaveNote({ keys: [`${source.letter}/${source.octave}`], duration: 'w' })
  if (source.accidental !== 0) {
    note.addModifier(new Accidental(source.accidental === -1 ? 'b' : '#'), 0)
  }
  return note
}

function Staff({ question }: { question: IntervalQuestion }) {
  const staffRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = staffRef.current
    if (!element) return

    const drawStaff = () => {
      const width = Math.max(element.clientWidth, 260)
      element.replaceChildren()

      try {
        const renderer = new Renderer(element, Renderer.Backends.SVG)
        renderer.resize(width, 205)
        const context = renderer.getContext()
        const staveWidth = Math.max(width - 20, 240)
        const staveX = (width - staveWidth) / 2
        const stave = new Stave(staveX, 42, staveWidth)
        stave.addClef('treble').setContext(context).draw()
        stave.setNoteStartX(staveX + Math.min(102, staveWidth * 0.25))

        const notes = [question.lower, question.upper]
        const isPrime = question.interval === 1
        const tickables = isPrime
          ? notes.map(createStaveNote)
          : [new StaveNote({
              keys: notes.map((item) => `${item.letter}/${item.octave}`),
              duration: 'w',
            })]
        if (!isPrime) {
          notes.forEach((item, index) => {
            if (item.accidental !== 0) {
              tickables[0].addModifier(new Accidental(item.accidental === -1 ? 'b' : '#'), index)
            }
          })
        }

        const voice = new Voice({ numBeats: isPrime ? 8 : 4, beatValue: 4 })
        voice.addTickables(tickables)
        new Formatter().joinVoices([voice]).format([voice], Math.max(staveWidth - 140, 80))
        voice.draw(context, stave)
      } catch (error) {
        console.error('VexFlow konnte die Noten nicht zeichnen.', error)
      }
    }

    drawStaff()
    const observer = new ResizeObserver(drawStaff)
    observer.observe(element)
    return () => observer.disconnect()
  }, [question])

  return <div className="staff" ref={staffRef} role="img" aria-label="Zwei Noten im Violinschlüssel" />
}

function Header({ onHome, showBack }: { onHome?: () => void; showBack?: boolean }) {
  return (
    <header className="topbar">
      <div className="brand">
        {showBack && (
          <button className="back-button" type="button" onClick={onHome} aria-label="Zur Startseite">
            <span aria-hidden="true">←</span>
          </button>
        )}
        <span className="brand-mark" aria-hidden="true">♫</span>
        <span>intervalle<span className="brand-accent">.</span></span>
      </div>
      <span className="brand-caption">MUSIKTRAINING</span>
    </header>
  )
}

function Home({ onStartBasic, onStartQuality, onStartMaster }: {
  onStartBasic: () => void
  onStartQuality: () => void
  onStartMaster: () => void
}) {
  return (
    <main className="app-shell">
      <Header />
      <section className="home-content">
        <div className="eyebrow"><span className="live-dot" /> INTERVALLTRAINER</div>
        <h1>Was möchtest du<br /><em>üben?</em></h1>
        <p className="home-intro">Wähle eine Übung und entdecke die Abstände zwischen zwei Noten.</p>
        <div className="app-cards">
          <button className="app-card" type="button" onClick={onStartBasic}>
            <span className="card-number">01</span>
            <span className="card-symbol" aria-hidden="true">♩</span>
            <span className="card-copy">
              <strong>Welches Intervall ist das?</strong>
              <small>Aufsteigende Intervalle im Violinschlüssel</small>
            </span>
            <span className="card-arrow" aria-hidden="true">→</span>
          </button>
          <button className="app-card" type="button" onClick={onStartQuality}>
            <span className="card-number">02</span>
            <span className="card-symbol card-accidentals" aria-hidden="true">♯♭</span>
            <span className="card-copy">
              <strong>Intervall bestimmen</strong>
              <small>Stammintervall und Qualität erkennen</small>
            </span>
            <span className="card-arrow" aria-hidden="true">→</span>
          </button>
          <button className="app-card" type="button" onClick={onStartMaster}>
            <span className="card-number">03</span>
            <span className="card-symbol card-master-symbol" aria-hidden="true">♭♯</span>
            <span className="card-copy">
              <strong>Intervall-Master</strong>
              <small>Qualität und Stammintervall genau bestimmen</small>
            </span>
            <span className="card-arrow" aria-hidden="true">→</span>
          </button>
        </div>
      </section>
      <footer><span>03 ANWENDUNGEN</span><span className="footer-note">Weitere Übungen folgen.</span></footer>
    </main>
  )
}

function Training({ onHome }: { onHome: () => void }) {
  const [question, setQuestion] = useState<IntervalQuestion>(() => createQuestion())
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [score, setScore] = useState({ correct: 0, wrong: 0 })
  const transitionTimer = useRef<number | null>(null)
  const answered = useRef(false)

  useEffect(() => () => {
    if (transitionTimer.current !== null) window.clearTimeout(transitionTimer.current)
  }, [])

  function answer(selected: IntervalNumber) {
    if (answered.current) return

    const correct = selected === question.interval
    answered.current = true
    setFeedback({ correct, selected })
    setScore((current) => ({
      correct: current.correct + Number(correct),
      wrong: current.wrong + Number(!correct),
    }))
    transitionTimer.current = window.setTimeout(() => {
      setQuestion(createQuestion())
      setFeedback(null)
      answered.current = false
      transitionTimer.current = null
    }, 1400)
  }

  function goHome() {
    if (transitionTimer.current !== null) window.clearTimeout(transitionTimer.current)
    transitionTimer.current = null
    answered.current = false
    onHome()
  }

  const total = score.correct + score.wrong

  return (
    <main className="app-shell">
      <Header showBack onHome={goHome} />
      <section className="content-grid">
        <div className="main-column">
          <div className="eyebrow"><span className="live-dot" /> INTERVALLE ERKENNEN <span className="eyebrow-line" /></div>
          <div className="title-row">
            <div>
              <h1>Wie groß ist<br /><em>das Intervall?</em></h1>
              <p className="intro">Zähle die Notenstufen von der unteren zur oberen Note.</p>
            </div>
            <div className="score-card" aria-label={`Richtig ${score.correct}, falsch ${score.wrong}`}>
              <span>DEINE ANTWORTEN</span>
              <strong>{score.correct}<i> / </i>{total}</strong>
              <small>{score.wrong} falsch</small>
            </div>
          </div>
          <div className="practice-panel">
            <div className="panel-label"><span>VIOLINSCHLÜSSEL</span><span>AUFSTEIGEND</span></div>
            <Staff question={question} />
            <div className="staff-caption" aria-live="polite">
              {feedback
                ? feedback.correct
                  ? `Richtig: eine ${intervalNames[question.interval]}.`
                  : `Noch nicht. Gesucht war eine ${intervalNames[question.interval]}.`
                : 'Wähle das Stamm­intervall der beiden Noten.'}
            </div>
          </div>
          <div className="answer-area">
            <div className="question-label">WÄHLE DAS INTERVALL</div>
            <div className="answer-grid">
              {intervalOptions.map((option) => {
                const isCorrect = feedback?.correct && option === question.interval
                const isWrongChoice = feedback && !feedback.correct && option === feedback.selected
                return (
                  <button
                    key={option}
                    type="button"
                    className={`answer-button${isCorrect ? ' answer-correct' : ''}${isWrongChoice ? ' answer-wrong' : ''}`}
                    onClick={() => answer(option)}
                    disabled={feedback !== null}
                    aria-pressed={feedback?.selected === option}
                  >
                    {intervalNames[option]}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
        <aside className="score-aside" aria-label="Übungsstand">
          <span className="aside-label">BISHER</span>
          <div className="score-line"><span>Richtig</span><strong>{score.correct}</strong></div>
          <div className="score-line"><span>Falsch</span><strong>{score.wrong}</strong></div>
          <div className="score-total">{total === 1 ? '1 Antwort' : `${total} Antworten`}</div>
          <div className="score-rule" />
          <p>Die Notennamen und Vorzeichen ändern nicht die Zahl der Notenstufen.</p>
        </aside>
      </section>
      <footer><span>{total === 1 ? '1 ANTWORT' : `${total} ANTWORTEN`}</span><span className="footer-note">Dein Ergebnis zählt für diese Runde.</span></footer>
    </main>
  )
}

function QualityTraining({ onHome }: { onHome: () => void }) {
  const [question, setQuestion] = useState<QualityQuestion>(() => createQualityQuestion())
  const [step, setStep] = useState<'interval' | 'quality'>('interval')
  const [feedback, setFeedback] = useState<QualityFeedback | null>(null)
  const [intervalWasCorrect, setIntervalWasCorrect] = useState(true)
  const [score, setScore] = useState({ correct: 0, wrong: 0 })
  const transitionTimer = useRef<number | null>(null)
  const locked = useRef(false)

  useEffect(() => () => {
    if (transitionTimer.current !== null) window.clearTimeout(transitionTimer.current)
  }, [])

  function answerInterval(selected: IntervalNumber) {
    if (locked.current) return

    const correct = selected === question.interval
    locked.current = true
    setFeedback({ step: 'interval', correct, selected })
    transitionTimer.current = window.setTimeout(() => {
      setIntervalWasCorrect(correct)
      setStep('quality')
      setFeedback(null)
      locked.current = false
      transitionTimer.current = null
    }, 1100)
  }

  function answerQuality(selected: IntervalQuality) {
    if (locked.current) return

    const correct = selected === question.quality
    locked.current = true
    setFeedback({ step: 'quality', correct, selected })
    setScore((current) => ({
      correct: current.correct + Number(correct && intervalWasCorrect),
      wrong: current.wrong + Number(!correct || !intervalWasCorrect),
    }))
    transitionTimer.current = window.setTimeout(() => {
      setQuestion(createQualityQuestion())
      setStep('interval')
      setIntervalWasCorrect(true)
      setFeedback(null)
      locked.current = false
      transitionTimer.current = null
    }, 1500)
  }

  function goHome() {
    if (transitionTimer.current !== null) window.clearTimeout(transitionTimer.current)
    transitionTimer.current = null
    locked.current = false
    onHome()
  }

  const total = score.correct + score.wrong
  const qualityOptions = qualityOptionsFor(question.interval)

  return (
    <main className="app-shell">
      <Header showBack onHome={goHome} />
      <section className="content-grid">
        <div className="main-column">
          <div className="eyebrow"><span className="live-dot" /> INTERVALL BESTIMMEN <span className="eyebrow-line" /></div>
          <div className="title-row">
            <div>
              <h1>Erst zählen,<br /><em>dann bestimmen.</em></h1>
              <p className="intro">Bestimme zuerst die Notenstufen, danach die Qualität des Intervalls.</p>
            </div>
            <div className="score-card" aria-label={`Richtig ${score.correct}, falsch ${score.wrong}`}>
              <span>DEINE ANTWORTEN</span>
              <strong>{score.correct}<i> / </i>{total}</strong>
              <small>{score.wrong} falsch</small>
            </div>
          </div>
          <div className="progress-row" aria-label={`Schritt ${step === 'interval' ? 1 : 2} von 2`}>
            <span className={step === 'interval' ? 'current' : 'done'}>01 <b>Stammintervall</b></span>
            <span className={step === 'quality' ? 'current' : ''}>02 <b>Qualität</b></span>
            <div className="progress-track"><i style={{ width: step === 'interval' ? '50%' : '100%' }} /></div>
          </div>
          <div className="practice-panel">
            <div className="panel-label"><span>VIOLINSCHLÜSSEL</span><span>AUFSTEIGEND</span></div>
            <Staff question={question} />
            <div className="staff-caption" aria-live="polite">
              {feedback?.step === 'interval'
                ? `${feedback.correct ? 'Richtig' : 'Noch nicht'}: Das Stammintervall ist die ${intervalNames[question.interval]}.`
                : feedback?.step === 'quality'
                  ? feedback.correct && intervalWasCorrect
                    ? `Richtig: ${question.fullName}.`
                    : `Gesucht war ${question.fullName}.`
                  : step === 'interval'
                    ? 'Zähle die Notenstufen von unten nach oben.'
                    : 'Welche Qualität hat dieses Intervall?'}
            </div>
          </div>
          <div className="answer-area">
            <div className="question-label">
              {step === 'interval' ? '01 · WÄHLE DAS STAMMINTERVALL' : '02 · WÄHLE DIE INTERVALLQUALITÄT'}
            </div>
            <div className={`answer-grid ${step === 'quality' ? 'quality-grid' : ''}`}>
              {step === 'interval'
                ? intervalOptions.map((option) => {
                    const showingIntervalFeedback = feedback?.step === 'interval'
                    const isCorrect = showingIntervalFeedback && option === question.interval
                    const isWrongChoice = showingIntervalFeedback && !feedback.correct && option === feedback.selected
                    return (
                      <button
                        key={option}
                        type="button"
                        className={`answer-button${isCorrect ? ' answer-correct' : ''}${isWrongChoice ? ' answer-wrong' : ''}`}
                        onClick={() => answerInterval(option)}
                        disabled={feedback !== null}
                      >
                        {intervalNames[option]}
                      </button>
                    )
                  })
                : qualityOptions.map((option) => {
                    const showingQualityFeedback = feedback?.step === 'quality'
                    const isCorrect = showingQualityFeedback && option === question.quality
                    const isWrongChoice = showingQualityFeedback && !feedback.correct && option === feedback.selected
                    return (
                      <button
                        key={option}
                        type="button"
                        className={`answer-button${isCorrect ? ' answer-correct' : ''}${isWrongChoice ? ' answer-wrong' : ''}`}
                        onClick={() => answerQuality(option)}
                        disabled={feedback !== null}
                      >
                        {qualityNames[option]}
                      </button>
                    )
                  })}
            </div>
          </div>
        </div>
        <aside className="score-aside" aria-label="Übungsstand">
          <span className="aside-label">BISHER</span>
          <div className="score-line"><span>Richtig</span><strong>{score.correct}</strong></div>
          <div className="score-line"><span>Falsch</span><strong>{score.wrong}</strong></div>
          <div className="score-total">{total === 1 ? '1 Intervall' : `${total} Intervalle`}</div>
          <div className="score-rule" />
          <p>Bei Quarte und Quinte kann das Intervall rein oder ein Tritonus sein.</p>
        </aside>
      </section>
      <footer><span>{total === 1 ? '1 INTERVALL' : `${total} INTERVALLE`}</span><span className="footer-note">Gezählt wird die vollständige Aufgabe.</span></footer>
    </main>
  )
}

function MasterTraining({ onHome }: { onHome: () => void }) {
  const [question, setQuestion] = useState<MasterQuestion>(() => createMasterQuestion())
  const [selectedQuality, setSelectedQuality] = useState<Exclude<IntervalQuality, 'tritone'> | null>(null)
  const [selectedInterval, setSelectedInterval] = useState<MasterIntervalAnswer | null>(null)
  const [feedback, setFeedback] = useState<boolean | null>(null)
  const [score, setScore] = useState({ correct: 0, wrong: 0 })
  const transitionTimer = useRef<number | null>(null)

  useEffect(() => () => {
    if (transitionTimer.current !== null) window.clearTimeout(transitionTimer.current)
  }, [])

  function submit() {
    if (selectedInterval === null || feedback !== null) return
    if (selectedInterval !== 'tritone' && selectedQuality === null) return

    const correct = selectedInterval === question.answerInterval && (
      question.answerInterval === 'tritone' || selectedQuality === question.quality
    )
    setFeedback(correct)
    setScore((current) => ({
      correct: current.correct + Number(correct),
      wrong: current.wrong + Number(!correct),
    }))
    transitionTimer.current = window.setTimeout(() => {
      setQuestion(createMasterQuestion())
      setSelectedQuality(null)
      setSelectedInterval(null)
      setFeedback(null)
      transitionTimer.current = null
    }, 1500)
  }

  function goHome() {
    if (transitionTimer.current !== null) window.clearTimeout(transitionTimer.current)
    transitionTimer.current = null
    onHome()
  }

  const total = score.correct + score.wrong
  const expectedAnswer = `${qualityNames[question.quality]} + ${masterIntervalNames[question.answerInterval]}`

  return (
    <main className="app-shell">
      <Header showBack onHome={goHome} />
      <section className="content-grid">
        <div className="main-column">
          <div className="eyebrow"><span className="live-dot" /> INTERVALL-MASTER <span className="eyebrow-line" /></div>
          <div className="title-row">
            <div>
              <h1>Bestimme das<br /><em>Intervall genau.</em></h1>
              <p className="intro">Wähle eine Qualität und ein Stammintervall. Sende dann deine Antwort ab.</p>
            </div>
            <div className="score-card" aria-label={`Richtig ${score.correct}, falsch ${score.wrong}`}>
              <span>DEINE ANTWORTEN</span>
              <strong>{score.correct}<i> / </i>{total}</strong>
              <small>{score.wrong} falsch</small>
            </div>
          </div>
          <div className="practice-panel">
            <div className="panel-label"><span>VIOLINSCHLÜSSEL</span><span>INTERVALL ERKENNEN</span></div>
            <Staff question={question} />
            <div className="staff-caption" aria-live="polite">
              {feedback === null
                ? 'Wähle je eine Antwort aus beiden Spalten.'
                : feedback
                  ? `Richtig: ${question.fullName}.`
                  : `Nicht ganz. Gesucht war: ${expectedAnswer}.`}
            </div>
          </div>
          <div className="answer-area master-answer-area">
            <div className="master-columns">
              <section className="master-column" aria-labelledby="quality-heading">
                <h2 className="question-label" id="quality-heading">QUALITÄT</h2>
                <div className="master-quality-options">
                  {masterQualityOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={`answer-button${selectedQuality === option ? ' answer-selected' : ''}${feedback !== null && option === question.quality ? ' answer-correct' : ''}${feedback === false && selectedQuality === option && option !== question.quality ? ' answer-wrong' : ''}`}
                      onClick={() => setSelectedQuality(option)}
                      disabled={feedback !== null}
                      aria-pressed={selectedQuality === option}
                    >
                      {qualityNames[option]}
                    </button>
                  ))}
                </div>
              </section>
              <section className="master-column" aria-labelledby="interval-heading">
                <h2 className="question-label" id="interval-heading">STAMMINTERVALL</h2>
                <div className="master-interval-options">
                  {masterIntervalOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={`answer-button${selectedInterval === option ? ' answer-selected' : ''}${feedback !== null && option === question.answerInterval ? ' answer-correct' : ''}${feedback === false && selectedInterval === option && option !== question.answerInterval ? ' answer-wrong' : ''}`}
                      onClick={() => setSelectedInterval(option)}
                      disabled={feedback !== null}
                      aria-pressed={selectedInterval === option}
                    >
                      {masterIntervalNames[option]}
                    </button>
                  ))}
                </div>
                <button className="submit-button" type="button" onClick={submit} disabled={selectedInterval === null || (selectedInterval !== 'tritone' && selectedQuality === null) || feedback !== null}>
                  Absenden <span aria-hidden="true">→</span>
                </button>
              </section>
            </div>
          </div>
        </div>
        <aside className="score-aside" aria-label="Übungsstand">
          <span className="aside-label">BISHER</span>
          <div className="score-line"><span>Richtig</span><strong>{score.correct}</strong></div>
          <div className="score-line"><span>Falsch</span><strong>{score.wrong}</strong></div>
          <div className="score-total">{total === 1 ? '1 Intervall' : `${total} Intervalle`}</div>
          <div className="score-rule" />
          <p>Verminderte Quinte und übermäßige Quarte zählen hier als Tritonus.</p>
        </aside>
      </section>
      <footer><span>{total === 1 ? '1 INTERVALL' : `${total} INTERVALLE`}</span><span className="footer-note">Ergebnis nach dem Absenden.</span></footer>
    </main>
  )
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [session, setSession] = useState(0)

  function startTraining(nextScreen: Exclude<Screen, 'home'>) {
    setSession((current) => current + 1)
    setScreen(nextScreen)
  }

  if (screen === 'home') {
    return (
      <Home
        onStartBasic={() => startTraining('training')}
        onStartQuality={() => startTraining('quality-training')}
        onStartMaster={() => startTraining('master-training')}
      />
    )
  }

  if (screen === 'training') {
    return <Training key={session} onHome={() => setScreen('home')} />
  }

  if (screen === 'quality-training') {
    return <QualityTraining key={session} onHome={() => setScreen('home')} />
  }

  return <MasterTraining key={session} onHome={() => setScreen('home')} />
}
