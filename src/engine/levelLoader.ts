export type SpinnerDefinition = {
  id: string
  letter_list: string[]
}

export type WordDefinition = {
  word: string
  image_asset: string
  audio_asset: string
}

export type Level = {
  level_id: string
  spinners: SpinnerDefinition[]
  word_list: WordDefinition[]
}

export type LevelLoadResult =
  | { level: Level; errors: [] }
  | { level: null; errors: string[] }

type LevelLoaderOptions = {
  assetExists?: (assetPath: string) => boolean
}

const vowels = new Set(['a', 'e', 'i', 'o', 'u'])

export function loadLevel(input: unknown, options: LevelLoaderOptions = {}): LevelLoadResult {
  const errors: string[] = []
  const assetExists = options.assetExists ?? (() => true)

  if (!isRecord(input)) {
    return { level: null, errors: ['Level must be a JSON object.'] }
  }

  if (typeof input.level_id !== 'string' || input.level_id.trim() === '') {
    errors.push('Level must include a non-empty level_id.')
  }

  const spinners = input.spinners
  const parsedSpinners: SpinnerDefinition[] = []
  if (!Array.isArray(spinners) || spinners.length === 0) {
    errors.push('Level must include at least one spinner.')
  } else {
    spinners.forEach((spinner, index) => {
      if (!isRecord(spinner) || typeof spinner.id !== 'string' || !Array.isArray(spinner.letter_list)) {
        errors.push(`Spinner ${index + 1} must include an id and letter_list.`)
        return
      }
      const letters = spinner.letter_list
      if (letters.length === 0 || letters.some((letter) => typeof letter !== 'string' || letter.length !== 1)) {
        errors.push(`Spinner ${spinner.id} must contain one-character letters.`)
        return
      }
      parsedSpinners.push({ id: spinner.id, letter_list: [...letters] as string[] })
    })
  }

  if (parsedSpinners.length === 3 && parsedSpinners[1].letter_list.some((letter) => !vowels.has(letter))) {
    errors.push('The middle spinner of a 3-spinner level must contain vowels only.')
  }

  const wordList = input.word_list
  const parsedWords: WordDefinition[] = []
  if (!Array.isArray(wordList) || wordList.length === 0) {
    errors.push('Level must include at least one word in word_list.')
  } else {
    wordList.forEach((wordEntry, index) => {
      if (!isRecord(wordEntry) || typeof wordEntry.word !== 'string' || typeof wordEntry.image_asset !== 'string' || typeof wordEntry.audio_asset !== 'string') {
        errors.push(`Word ${index + 1} must include word, image_asset, and audio_asset.`)
        return
      }
      const word = wordEntry.word
      if (word.length !== parsedSpinners.length || [...word].some((letter, letterIndex) => !parsedSpinners[letterIndex]?.letter_list.includes(letter))) {
        errors.push(`Word "${word}" cannot be spelled by the declared spinners.`)
      }
      if (!assetExists(wordEntry.image_asset)) {
        errors.push(`Missing image asset: ${wordEntry.image_asset}`)
      }
      if (!assetExists(wordEntry.audio_asset)) {
        errors.push(`Missing audio asset: ${wordEntry.audio_asset}`)
      }
      parsedWords.push({ word, image_asset: wordEntry.image_asset, audio_asset: wordEntry.audio_asset })
    })
  }

  if (errors.length > 0) {
    return { level: null, errors }
  }

  return {
    level: {
      level_id: input.level_id as string,
      spinners: parsedSpinners,
      word_list: parsedWords,
    },
    errors: [],
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}