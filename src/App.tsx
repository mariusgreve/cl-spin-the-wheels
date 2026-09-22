import { useEffect, useMemo, useRef, useState } from 'react'
import levelData from './assets/levels/level-1.json'
import { Confetti } from './components/Confetti'
import { Spinner, type SpinnerHandle } from './components/Spinner'
import { loadLevel, type WordDefinition } from './engine/levelLoader'
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

export function App() {
  const [currentLevelId, setCurrentLevelId] = useState('level-1')
  const levelDefinition = bundledLevels[currentLevelId] ?? levelData
  const result = useMemo(() => loadLevel(levelDefinition, { assetExists: (assetPath) => assetUrl(assetPath) !== null }), [levelDefinition])
  const [spinnerStates, setSpinnerStates] = useState<SpinnerState[]>(() =>
    result.level ? result.level.spinners.map(createSpinnerState) : [],
  )
  const [matchedWord, setMatchedWord] = useState<WordDefinition | null>(null)
  const [gameState, setGameState] = useState<'Idle' | 'Spinning' | 'SettledMatch' | 'SettledNoMatch'>('Idle')
  const [pendingLevelTransition, setPendingLevelTransition] = useState<string | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const spinnerRefs = useRef<Array<SpinnerHandle | null>>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const spinInProgressRef = useRef(false)
  const progressionTrackerRef = useRef<ProgressionTracker | null>(null)
  const confettiTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    if (!result.level) {
      return
    }

    progressionTrackerRef.current = new ProgressionTracker(result.level)
    setSpinnerStates(result.level.spinners.map(createSpinnerState))
    setMatchedWord(null)
    setGameState('Idle')
    spinnerRefs.current = []
    setPendingLevelTransition(null)
    setShowConfetti(false)
    if (confettiTimeoutRef.current !== null) {
      window.clearTimeout(confettiTimeoutRef.current)
      confettiTimeoutRef.current = null
    }

    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current.src = ''
    }
  }, [result.level])

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

  if (!result.level) {
    return (
      <main className="shell error-state">
        <p className="eyebrow">Spin The Wheels</p>
        <h1>Level unavailable</h1>
        <p>The bundled level could not be loaded, so play cannot start.</p>
        <ul aria-label="Level validation errors">
          {result.errors.map((error) => <li key={error}>{error}</li>)}
        </ul>
      </main>
    )
  }

  const resolveSettledSpinners = (nextSpinners: SpinnerState[]) => {
    setSpinnerStates(nextSpinners)

    const match = resolveWordMatch(result.level, nextSpinners)
    if (match) {
      const decision = progressionTrackerRef.current?.recordMatch(match.word) ?? {
        shouldTransition: false,
        distinctMatches: 0,
        threshold: 0,
        nextLevelId: undefined,
      }

      setMatchedWord(match)
      setGameState('SettledMatch')

      if (decision.shouldTransition && result.level?.next_level_id) {
        const nextLevelId = result.level.next_level_id
        const nextLevelDefinition = bundledLevels[nextLevelId]
        if (!nextLevelDefinition) {
          return
        }

        const nextResult = loadLevel(nextLevelDefinition, { assetExists: (assetPath) => assetUrl(assetPath) !== null })
        if (!nextResult.level) {
          return
        }

        // Defer the switch so the just-matched word stays on screen until the next spin.
        setPendingLevelTransition(nextLevelId)
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
    if (!result.level || spinInProgressRef.current) {
      return
    }

    const nextSpinners = result.level.spinners.map((spinner, index) => {
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

    const currentWord = resolveWordMatch(result.level, spinnerStates)
    const pickedWord = spinForWord(result.level, currentWord?.word)
    spinInProgressRef.current = true
    setGameState('Spinning')
    setMatchedWord(null)

    const wheelPaths = result.level.spinners.map((spinner, index) => {
      const currentIndex = spinnerStates[index].currentIndex
      const targetIndex = spinner.letter_list.indexOf(pickedWord.letters[index])
      const forwardDistance = (targetIndex - currentIndex + spinner.letter_list.length) % spinner.letter_list.length
      return spinner.letter_list.length * 2 + forwardDistance
    })
    let previousPath = 0
    const wheelAnimations = pickedWord.letters.map((letter, index) => {
      const path = wheelPaths[index] ?? previousPath
      const extraSteps = index === 0 ? 0 : Math.max(0, previousPath + 5 - path)
      previousPath = path + extraSteps
      return spinnerRefs.current[index]?.animateAndSettle(letter, 100, extraSteps)
    })

    await Promise.all(wheelAnimations)
    spinInProgressRef.current = false
    const nextSpinners = result.level.spinners.map((spinner, index) => {
      const nextSpinner = createSpinnerState(spinner)
      nextSpinner.currentIndex = spinner.letter_list.indexOf(pickedWord.letters[index])
      return nextSpinner
    })
    resolveSettledSpinners(nextSpinners)
  }

  const rewardImage = matchedWord ? assetUrl(matchedWord.image_asset) : null
  const rewardAlt = matchedWord && gameState === 'SettledMatch' ? `${matchedWord.word} reward` : 'confused reward'
  const spinButtonLabel = gameState === 'Spinning' ? 'Spinning...' : pendingLevelTransition ? 'Go to next level' : 'Spin'

  return (
    <main className="shell">
      <Confetti active={showConfetti} />
      <header className="masthead">
        <div className="masthead-top">
          <p className="eyebrow">Spin The Wheels</p>
          <span className="level-tag">{result.level.level_id}</span>
        </div>
        <h1>Make a word</h1>
      </header>
      <section className="picture-area" aria-label="Picture area">
        {rewardImage ? (
          <img src={rewardImage} alt={rewardAlt} />
        ) : (
          <div className="picture-placeholder" aria-label="No reward yet">?</div>
        )}
      </section>
      <section className="spinner-row" aria-label="Letter wheels">
        {result.level.spinners.map((spinner, index) => (
          <Spinner
            key={spinner.id}
            ref={(instance) => { spinnerRefs.current[index] = instance }}
            definition={spinner}
            position={index}
            totalSpinners={result.level!.spinners.length}
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