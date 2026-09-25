import { useEffect, useMemo, useRef, useState } from 'react'
import { Confetti } from './components/Confetti'
import { Spinner, type SpinnerHandle } from './components/Spinner'
import { loadLevelCollection, type WordDefinition } from './engine/levelLoader'
import { ProgressionTracker } from './engine/progressionTracker'
import { createSpinnerState, resolveWordMatch, spinForWord, type SpinnerState } from './engine/spinner'
import './styles.css'

const bundledAssets = import.meta.glob('./assets/**/*', { eager: true, query: '?url', import: 'default' }) as Record<string, string>
const bundledLevelFiles = import.meta.glob('./assets/levels/*.json', { eager: true, import: 'default' }) as Record<string, unknown>
const bundledLevels = Object.fromEntries(
  Object.entries(bundledLevelFiles).map(([path, value]) => {
    const fileName = path.split('/').at(-1)?.replace(/\.json$/, '') ?? ''
    return [fileName, value as unknown]
  }),
) as Record<string, unknown>

function createNoMatchWord(): WordDefinition {
  return {
    word: 'confused',
    image_asset: 'assets/images/gibberish.png',
    audio_asset: 'assets/audio/gibberish.wav',
  }
}

function assetUrl(assetPath: string): string | null {
  const relativePath = `./${assetPath.replace(/^\//, '')}`
  return bundledAssets[relativePath] ?? null
}

function formatLevelId(levelId: string): string {
  return levelId.replace(/[\p{Dash_Punctuation}]/gu, ' ')
}

export type AppProps = {
  levels?: Record<string, unknown>
  initialLevelId?: string
}

function getInitialLevelId(initialLevelId?: string): string {
  if (initialLevelId) {
    return initialLevelId
  }

  if (typeof window === 'undefined') {
    return 'level-1'
  }

  const params = new URLSearchParams(window.location.search)
  return params.get('level') ?? 'level-1'
}

export function App({ levels = bundledLevels, initialLevelId }: AppProps = {}) {
  const resolvedInitialLevelId = getInitialLevelId(initialLevelId)

  const levelResult = useMemo(
    () => loadLevelCollection(levels, {
      assetExists: (assetPath) => assetUrl(assetPath) !== null,
    }),
    [levels],
  )
  const [currentLevelId, setCurrentLevelId] = useState(resolvedInitialLevelId)

  useEffect(() => {
    setCurrentLevelId(resolvedInitialLevelId)
  }, [resolvedInitialLevelId])

  const currentLevel = levelResult.levels?.[currentLevelId] ?? null
  const validationErrors = currentLevel
    ? []
    : levelResult.levels
      ? [`Starting level "${currentLevelId}" is not bundled.`]
      : levelResult.errors
  const [spinnerStates, setSpinnerStates] = useState<SpinnerState[]>(() =>
    currentLevel ? currentLevel.spinners.map(createSpinnerState) : [],
  )
  const [matchedWord, setMatchedWord] = useState<WordDefinition | null>(null)
  const [gameState, setGameState] = useState<'Idle' | 'Spinning' | 'SettledMatch' | 'SettledNoMatch'>('Idle')
  const [pendingLevelTransition, setPendingLevelTransition] = useState<string | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [levelProgress, setLevelProgress] = useState<{ distinctMatches: number; threshold: number } | null>(null)
  const spinnerRefs = useRef<Array<SpinnerHandle | null>>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const spinInProgressRef = useRef(false)
  const progressionTrackerRef = useRef<ProgressionTracker | null>(null)
  const confettiTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    if (!currentLevel) {
      return
    }

    progressionTrackerRef.current = new ProgressionTracker(currentLevel)
    setSpinnerStates(currentLevel.spinners.map(createSpinnerState))
    setMatchedWord(null)
    setGameState('Idle')
    spinnerRefs.current = []
    setPendingLevelTransition(null)
    setShowConfetti(false)
    setLevelProgress(currentLevel.next_level_id ? progressionTrackerRef.current.getProgress() : null)
    if (confettiTimeoutRef.current !== null) {
      window.clearTimeout(confettiTimeoutRef.current)
      confettiTimeoutRef.current = null
    }

    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current.src = ''
    }
  }, [currentLevel])

  useEffect(() => {
    if (!matchedWord) {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
      return
    }

    const audioUrl = assetUrl(matchedWord.audio_asset)
    if (!audioUrl || !audioRef.current) {
      return
    }

    const audio = audioRef.current
    audio.pause()
    audio.currentTime = 0
    audio.src = audioUrl
    audio.play().catch(() => {
      // Audio may be blocked until user interaction; gameplay keeps moving without crashing.
    })
  }, [matchedWord])

  useEffect(() => {
    return () => {
      if (confettiTimeoutRef.current !== null) {
        window.clearTimeout(confettiTimeoutRef.current)
      }
    }
  }, [])

  if (!currentLevel) {
    return (
      <main className="shell error-state">
        <p className="eyebrow">Spin The Wheels</p>
        <h1>Levels unavailable</h1>
        <p>The bundled levels could not be validated, so play cannot start.</p>
        <ul aria-label="Level validation errors">
          {validationErrors.map((error) => <li key={error}>{error}</li>)}
        </ul>
      </main>
    )
  }

  const resolveSettledSpinners = (nextSpinners: SpinnerState[]) => {
    setSpinnerStates(nextSpinners)

    const match = resolveWordMatch(currentLevel, nextSpinners)
    if (match) {
      const decision = progressionTrackerRef.current?.recordMatch(match.word) ?? {
        shouldTransition: false,
        distinctMatches: 0,
        threshold: 0,
        nextLevelId: undefined,
      }

      setMatchedWord(match)
      setGameState('SettledMatch')

      if (currentLevel.next_level_id) {
        setLevelProgress({ distinctMatches: decision.distinctMatches, threshold: decision.threshold })
      }

      if (decision.shouldTransition && currentLevel.next_level_id) {
        // Defer the switch so the just-matched word stays on screen until the next spin.
        setPendingLevelTransition(currentLevel.next_level_id)
        setShowConfetti(true)
        if (confettiTimeoutRef.current !== null) {
          window.clearTimeout(confettiTimeoutRef.current)
        }
        confettiTimeoutRef.current = window.setTimeout(() => {
          setShowConfetti(false)
          confettiTimeoutRef.current = null
        }, 2800)
      }
      return
    }

    setMatchedWord(createNoMatchWord())
    setGameState('SettledNoMatch')
  }

  const handleSettled = () => {
    if (spinInProgressRef.current) {
      return
    }

    const nextSpinners = currentLevel.spinners.map((spinner, index) => {
      const currentIndex = spinnerRefs.current[index]?.getCurrentIndex() ?? spinnerStates[index]?.currentIndex ?? 0
      return {
        ...spinner,
        currentIndex,
      }
    })

    resolveSettledSpinners(nextSpinners)
  }

  const handleSpin = async () => {
    if (gameState === 'Spinning') {
      return
    }

    if (pendingLevelTransition) {
      setPendingLevelTransition(null)
      setCurrentLevelId(pendingLevelTransition)
      return
    }

    const currentWord = resolveWordMatch(currentLevel, spinnerStates)
    const pickedWord = spinForWord(currentLevel, currentWord?.word)
    spinInProgressRef.current = true
    setGameState('Spinning')
    setMatchedWord(null)

    const wheelPaths = currentLevel.spinners.map((spinner, index) => {
      const currentIndex = spinnerStates[index].currentIndex
      const targetIndex = spinner.letter_list.indexOf(pickedWord.letters[index])
      const forwardDistance = (targetIndex - currentIndex + spinner.letter_list.length) % spinner.letter_list.length
      return spinner.letter_list.length * 2 + forwardDistance
    })
    let previousPath = 0
    const wheelAnimations = pickedWord.letters.map((letter, index) => {
      const path = wheelPaths[index] ?? previousPath
      const letterCount = currentLevel.spinners[index].letter_list.length
      // Round up to a whole number of loops so the padding never shifts which letter the
      // timed animation lands on (a partial-loop pad would need a reverse correction at settle).
      const rawExtraSteps = index === 0 ? 0 : Math.max(0, previousPath + 5 - path)
      const extraSteps = Math.ceil(rawExtraSteps / letterCount) * letterCount
      previousPath = path + extraSteps
      return spinnerRefs.current[index]?.animateAndSettle(letter, 100, extraSteps)
    })

    await Promise.all(wheelAnimations)
    spinInProgressRef.current = false
    const nextSpinners = currentLevel.spinners.map((spinner, index) => {
      const nextSpinner = createSpinnerState(spinner)
      nextSpinner.currentIndex = spinner.letter_list.indexOf(pickedWord.letters[index])
      return nextSpinner
    })
    resolveSettledSpinners(nextSpinners)
  }

  const rewardImage = matchedWord ? assetUrl(matchedWord.image_asset) : null
  const hasMatchedWord = matchedWord !== null && gameState === 'SettledMatch'
  const rewardAlt = matchedWord && gameState === 'SettledMatch' ? `${matchedWord.word} reward` : 'confused reward'
  const spinButtonLabel = gameState === 'Spinning' ? 'Spinning...' : pendingLevelTransition ? 'Go to next level' : 'Spin'
  const feedbackState = pendingLevelTransition
    ? 'progression'
    : gameState === 'SettledMatch'
      ? 'match'
      : gameState === 'SettledNoMatch'
        ? 'no-match'
        : gameState.toLowerCase()
  const taskMessage = pendingLevelTransition
    ? 'You made enough words!'
    : gameState === 'Spinning'
      ? 'Watch the letters come together.'
      : gameState === 'SettledMatch' && matchedWord
        ? `You made ${matchedWord.word}!`
        : gameState === 'SettledNoMatch'
          ? 'Try another letter combination.'
          : 'Spin to build it.'

  return (
    <main className="shell" data-game-state={gameState.toLowerCase()}>
      <Confetti active={showConfetti} />
      <header className="masthead">
        <div className="masthead-top">
          <p className="eyebrow">Spin The Wheels</p>
          <span className="level-tag">{formatLevelId(currentLevel.level_id)}</span>
        </div>
        <h1>Make a word</h1>
        <p className={`task-message task-message--${feedbackState}`} role="status">{taskMessage}</p>
      </header>
      <div
        className={levelProgress ? 'level-progress' : 'level-progress is-hidden'}
        role="progressbar"
        aria-hidden={levelProgress ? undefined : true}
        aria-label="Progress to next level"
        aria-valuemin={0}
        aria-valuemax={levelProgress?.threshold ?? 0}
        aria-valuenow={levelProgress ? Math.min(levelProgress.distinctMatches, levelProgress.threshold) : 0}
      >
        <div className="level-progress-track">
          {Array.from({ length: levelProgress?.threshold ?? 1 }, (_, index) => (
            <span
              key={index}
              className={levelProgress && index < levelProgress.distinctMatches ? 'level-progress-pip is-filled' : 'level-progress-pip'}
            />
          ))}
        </div>
        <p className="level-progress-label">
          {levelProgress
            ? `${Math.max(0, levelProgress.threshold - levelProgress.distinctMatches)} word${levelProgress.threshold - levelProgress.distinctMatches === 1 ? '' : 's'} to next level`
            : '\u00A0'}
        </p>
      </div>
      <section className={`picture-area picture-area--${feedbackState}`} aria-label="Picture area">
        {rewardImage ? (
          <img src={rewardImage} alt={rewardAlt} />
        ) : (
          <div className="picture-placeholder" aria-label="No reward yet">?</div>
        )}
        <p
          className={hasMatchedWord ? 'reward-caption is-visible' : 'reward-caption'}
          aria-hidden={hasMatchedWord ? undefined : true}
        >
          {hasMatchedWord ? matchedWord.word : '\u00A0'}
        </p>
      </section>
      <section className="spinner-row" aria-label="Letter wheels">
        {currentLevel.spinners.map((spinner, index) => (
          <Spinner
            key={spinner.id}
            ref={(instance) => { spinnerRefs.current[index] = instance }}
            definition={spinner}
            position={index}
            totalSpinners={currentLevel.spinners.length}
            controlsDisabled={gameState === 'Spinning' || Boolean(pendingLevelTransition)}
            onSettled={gameState === 'Spinning' ? undefined : handleSettled}
          />
        ))}
      </section>
      <button
        className={pendingLevelTransition ? 'spin-button spin-button--next-level' : 'spin-button'}
        type="button"
        onClick={() => void handleSpin()}
        disabled={gameState === 'Spinning'}
      >
        {spinButtonLabel}
      </button>
      <audio ref={audioRef} preload="auto" />
    </main>
  )
}