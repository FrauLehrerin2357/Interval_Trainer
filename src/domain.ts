export type NoteLetter = 'c' | 'd' | 'e' | 'f' | 'g' | 'a' | 'b'
export type AccidentalValue = -1 | 0 | 1
export type IntervalNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

export type Note = {
  letter: NoteLetter
  octave: number
  accidental: AccidentalValue
}

export type IntervalQuestion = {
  lower: Note
  upper: Note
  interval: IntervalNumber
}

export type IntervalQuality = 'pure' | 'diminished' | 'minor' | 'major' | 'augmented' | 'tritone'
export type QualityQuestion = IntervalQuestion & {
  quality: IntervalQuality
  fullName: string
}

const letters: NoteLetter[] = ['c', 'd', 'e', 'f', 'g', 'a', 'b']
const naturalSemitones: Record<NoteLetter, number> = {
  c: 0,
  d: 2,
  e: 4,
  f: 5,
  g: 7,
  a: 9,
  b: 11,
}

function pitchInSemitones(note: Note) {
  return note.octave * 12 + naturalSemitones[note.letter] + note.accidental
}

export function createQuestion(): IntervalQuestion {
  const interval = (Math.floor(Math.random() * 8) + 1) as IntervalNumber
  const lowerLetterIndex = Math.floor(Math.random() * letters.length)
  const upperLetterIndex = lowerLetterIndex + interval - 1
  const lowerLetter = letters[lowerLetterIndex]
  const upperLetter = letters[upperLetterIndex % letters.length]
  const lowerOctave = 4
  const upperOctave = lowerOctave + Math.floor(upperLetterIndex / letters.length)
  const withAccidentals = Math.random() < 0.45

  let lowerAccidental: AccidentalValue = 0
  let upperAccidental: AccidentalValue = 0

  if (withAccidentals) {
    const possiblePairs: Array<[AccidentalValue, AccidentalValue]> = []
    const values: AccidentalValue[] = [-1, 0, 1]

    for (const lowerValue of values) {
      for (const upperValue of values) {
        const lower = { letter: lowerLetter, octave: lowerOctave, accidental: lowerValue }
        const upper = { letter: upperLetter, octave: upperOctave, accidental: upperValue }
        if (
          pitchInSemitones(upper) > pitchInSemitones(lower) &&
          (lowerValue !== 0 || upperValue !== 0)
        ) {
          possiblePairs.push([lowerValue, upperValue])
        }
      }
    }

    const chosenPair = possiblePairs[Math.floor(Math.random() * possiblePairs.length)]
    if (chosenPair) [lowerAccidental, upperAccidental] = chosenPair
  }

  return {
    lower: { letter: lowerLetter, octave: lowerOctave, accidental: lowerAccidental },
    upper: { letter: upperLetter, octave: upperOctave, accidental: upperAccidental },
    interval,
  }
}

export const intervalNames: Record<IntervalNumber, string> = {
  1: 'Prime',
  2: 'Sekunde',
  3: 'Terz',
  4: 'Quarte',
  5: 'Quinte',
  6: 'Sexte',
  7: 'Septime',
  8: 'Oktave',
}

export const intervalOptions: IntervalNumber[] = [1, 2, 3, 4, 5, 6, 7, 8]

const qualityProfiles: Array<{
  intervals: IntervalNumber[]
  quality: IntervalQuality
  semitones: number
  fullName: string
}> = [
  { intervals: [1], quality: 'pure', semitones: 0, fullName: 'Reine Prime' },
  { intervals: [2], quality: 'minor', semitones: 1, fullName: 'Kleine Sekunde' },
  { intervals: [2], quality: 'major', semitones: 2, fullName: 'Große Sekunde' },
  { intervals: [3], quality: 'minor', semitones: 3, fullName: 'Kleine Terz' },
  { intervals: [3], quality: 'major', semitones: 4, fullName: 'Große Terz' },
  { intervals: [4, 5], quality: 'tritone', semitones: 6, fullName: 'Tritonus' },
  { intervals: [4], quality: 'pure', semitones: 5, fullName: 'Reine Quarte' },
  { intervals: [5], quality: 'pure', semitones: 7, fullName: 'Reine Quinte' },
  { intervals: [6], quality: 'minor', semitones: 8, fullName: 'Kleine Sexte' },
  { intervals: [6], quality: 'major', semitones: 9, fullName: 'Große Sexte' },
  { intervals: [7], quality: 'minor', semitones: 10, fullName: 'Kleine Septime' },
  { intervals: [7], quality: 'major', semitones: 11, fullName: 'Große Septime' },
  { intervals: [8], quality: 'pure', semitones: 12, fullName: 'Reine Oktave' },
]

export const qualityNames: Record<IntervalQuality, string> = {
  pure: 'Rein',
  diminished: 'Vermindert',
  minor: 'Klein',
  major: 'Groß',
  augmented: 'Übermäßig',
  tritone: 'Tritonus',
}

export function qualityOptionsFor(interval: IntervalNumber): IntervalQuality[] {
  if (interval === 1 || interval === 8) return ['pure']
  if (interval === 2 || interval === 3 || interval === 6 || interval === 7) {
    return ['minor', 'major']
  }
  return ['pure', 'tritone']
}

export function createQualityQuestion(): QualityQuestion {
  const profile = qualityProfiles[Math.floor(Math.random() * qualityProfiles.length)]
  const interval = profile.intervals[Math.floor(Math.random() * profile.intervals.length)]
  const lowerLetterIndex = Math.floor(Math.random() * letters.length)
  const upperLetterIndex = lowerLetterIndex + interval - 1
  const lowerLetter = letters[lowerLetterIndex]
  const upperLetter = letters[upperLetterIndex % letters.length]
  const lowerOctave = 4
  const upperOctave = lowerOctave + Math.floor(upperLetterIndex / letters.length)
  const values: AccidentalValue[] = [-1, 0, 1]
  const possiblePairs: Array<[AccidentalValue, AccidentalValue]> = []

  for (const lowerAccidental of values) {
    for (const upperAccidental of values) {
      const lower = { letter: lowerLetter, octave: lowerOctave, accidental: lowerAccidental }
      const upper = { letter: upperLetter, octave: upperOctave, accidental: upperAccidental }
      if (pitchInSemitones(upper) - pitchInSemitones(lower) === profile.semitones) {
        possiblePairs.push([lowerAccidental, upperAccidental])
      }
    }
  }

  const accidentalPairs = possiblePairs.filter(([lower, upper]) => lower !== 0 || upper !== 0)
  const useAccidentals = accidentalPairs.length > 0 && Math.random() < 0.45
  const chosenPairs = useAccidentals ? accidentalPairs : possiblePairs
  const [lowerAccidental, upperAccidental] = chosenPairs[Math.floor(Math.random() * chosenPairs.length)]

  return {
    lower: { letter: lowerLetter, octave: lowerOctave, accidental: lowerAccidental },
    upper: { letter: upperLetter, octave: upperOctave, accidental: upperAccidental },
    interval,
    quality: profile.quality,
    fullName: profile.fullName,
  }
}

export type MasterIntervalAnswer = IntervalNumber | 'tritone'
export type MasterQuestion = IntervalQuestion & {
  quality: Exclude<IntervalQuality, 'tritone'>
  answerInterval: MasterIntervalAnswer
  fullName: string
}

export const masterQualityOptions: Exclude<IntervalQuality, 'tritone'>[] = [
  'pure',
  'diminished',
  'minor',
  'major',
  'augmented',
]

export const masterIntervalOptions: MasterIntervalAnswer[] = [1, 2, 3, 4, 'tritone', 5, 6, 7, 8]

export const masterIntervalNames: Record<MasterIntervalAnswer, string> = {
  1: 'Prime',
  2: 'Sekunde',
  3: 'Terz',
  4: 'Quarte',
  tritone: 'Tritonus',
  5: 'Quinte',
  6: 'Sexte',
  7: 'Septime',
  8: 'Oktave',
}

const masterProfiles: Array<{
  interval: IntervalNumber
  answerInterval: MasterIntervalAnswer
  quality: Exclude<IntervalQuality, 'tritone'>
  semitones: number
  fullName: string
}> = [
  { interval: 1, answerInterval: 1, quality: 'diminished', semitones: -1, fullName: 'Verminderte Prime' },
  { interval: 1, answerInterval: 1, quality: 'pure', semitones: 0, fullName: 'Reine Prime' },
  { interval: 1, answerInterval: 1, quality: 'augmented', semitones: 1, fullName: 'Übermäßige Prime' },
  { interval: 2, answerInterval: 2, quality: 'minor', semitones: 1, fullName: 'Kleine Sekunde' },
  { interval: 2, answerInterval: 2, quality: 'major', semitones: 2, fullName: 'Große Sekunde' },
  { interval: 3, answerInterval: 3, quality: 'minor', semitones: 3, fullName: 'Kleine Terz' },
  { interval: 3, answerInterval: 3, quality: 'major', semitones: 4, fullName: 'Große Terz' },
  { interval: 4, answerInterval: 4, quality: 'diminished', semitones: 4, fullName: 'Verminderte Quarte' },
  { interval: 4, answerInterval: 4, quality: 'pure', semitones: 5, fullName: 'Reine Quarte' },
  { interval: 4, answerInterval: 'tritone', quality: 'augmented', semitones: 6, fullName: 'Übermäßige Quarte als Tritonus' },
  { interval: 5, answerInterval: 'tritone', quality: 'diminished', semitones: 6, fullName: 'Verminderte Quinte als Tritonus' },
  { interval: 5, answerInterval: 5, quality: 'pure', semitones: 7, fullName: 'Reine Quinte' },
  { interval: 5, answerInterval: 5, quality: 'augmented', semitones: 8, fullName: 'Übermäßige Quinte' },
  { interval: 6, answerInterval: 6, quality: 'minor', semitones: 8, fullName: 'Kleine Sexte' },
  { interval: 6, answerInterval: 6, quality: 'major', semitones: 9, fullName: 'Große Sexte' },
  { interval: 7, answerInterval: 7, quality: 'minor', semitones: 10, fullName: 'Kleine Septime' },
  { interval: 7, answerInterval: 7, quality: 'major', semitones: 11, fullName: 'Große Septime' },
  { interval: 8, answerInterval: 8, quality: 'diminished', semitones: 11, fullName: 'Verminderte Oktave' },
  { interval: 8, answerInterval: 8, quality: 'pure', semitones: 12, fullName: 'Reine Oktave' },
  { interval: 8, answerInterval: 8, quality: 'augmented', semitones: 13, fullName: 'Übermäßige Oktave' },
]

export function createMasterQuestion(): MasterQuestion {
  const profile = masterProfiles[Math.floor(Math.random() * masterProfiles.length)]
  const lowerLetterIndex = Math.floor(Math.random() * letters.length)
  const upperLetterIndex = lowerLetterIndex + profile.interval - 1
  const lowerLetter = letters[lowerLetterIndex]
  const upperLetter = letters[upperLetterIndex % letters.length]
  const lowerOctave = 4
  const upperOctave = lowerOctave + Math.floor(upperLetterIndex / letters.length)
  const values: AccidentalValue[] = [-1, 0, 1]
  const possiblePairs: Array<[AccidentalValue, AccidentalValue]> = []

  for (const lowerAccidental of values) {
    for (const upperAccidental of values) {
      const lower = { letter: lowerLetter, octave: lowerOctave, accidental: lowerAccidental }
      const upper = { letter: upperLetter, octave: upperOctave, accidental: upperAccidental }
      if (pitchInSemitones(upper) - pitchInSemitones(lower) === profile.semitones) {
        possiblePairs.push([lowerAccidental, upperAccidental])
      }
    }
  }

  const accidentalPairs = possiblePairs.filter(([lower, upper]) => lower !== 0 || upper !== 0)
  const useAccidentals = accidentalPairs.length > 0 && Math.random() < 0.45
  const chosenPairs = useAccidentals ? accidentalPairs : possiblePairs
  const [lowerAccidental, upperAccidental] = chosenPairs[Math.floor(Math.random() * chosenPairs.length)]

  return {
    lower: { letter: lowerLetter, octave: lowerOctave, accidental: lowerAccidental },
    upper: { letter: upperLetter, octave: upperOctave, accidental: upperAccidental },
    interval: profile.interval,
    quality: profile.quality,
    answerInterval: profile.answerInterval,
    fullName: profile.fullName,
  }
}

export function noteDescription(note: Note) {
  const accidental = note.accidental === -1 ? 'b' : note.accidental === 1 ? 'Kreuz' : ''
  const letter = note.letter === 'b' ? 'H' : note.letter.toUpperCase()
  return `${letter}${accidental} ${note.octave}`
}
