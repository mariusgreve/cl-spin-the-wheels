import { useEffect, useMemo, useRef, useState } from 'react'
import levelData from './assets/levels/level-1.json'
import { Spinner, type SpinnerHandle } from './components/Spinner'
import { loadLevel, type WordDefinition } from './engine/levelLoader'
import { createSpinnerState, resolveWordMatch, spinForWord, type SpinnerState } from './engine/spinner'
import './styles.css'

const bundledAssets = import.meta.glob('./assets/**/*', { eager: true, query: '?url', import: 'default' }) as Record<string, string>

function assetUrl(assetPath: string): string | null {
  const relativePath = `./${assetPath.replace(/^\//, '')}`
  return bundledAssets[relativePath] ?? null
}

export function App() {
  const result = useMemo(() => loadLevel(levelData, { assetExists: (assetPath) => assetUrl(assetPath) !== null }), [])
  const [spinnerStates, setSpinnerStates] = useState<SpinnerState[]>(() =>
    result.level ? result.level.spinners.map(createSpinnerState) : [],
  )
  const [matchedWord, setMatchedWord] = useState<WordDefinition | null>(null)
  const [gameState, setGameState] = useState<'Idle' | 'Spinning' | 'SettledMatch'>('Idle')
  const spinnerRefs = useRef<Array<SpinnerHandle | null>>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (!result.level) {
      return
    }

    setSpinnerStates(result.level.spinners.map(createSpinnerState))
    setMatchedWord(null)
    setGameState('Idle')
    spinnerRefs.current = []
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

  const handleSpin = async () => {
    if (gameState === 'Spinning') {
      return
    }

    const currentWord = resolveWordMatch(result.level, spinnerStates)
    const pickedWord = spinForWord(result.level, currentWord?.word)
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
    const nextSpinners = result.level.spinners.map((spinner, index) => {
      const nextSpinner = createSpinnerState(spinner)
      nextSpinner.currentIndex = spinner.letter_list.indexOf(pickedWord.letters[index])
      return nextSpinner
    })
    setSpinnerStates(nextSpinners)

    const match = resolveWordMatch(result.level, nextSpinners)
    if (match) {
      setMatchedWord(match)
      setGameState('SettledMatch')
      return
    }

    setGameState('Idle')
  }

  const rewardImage = matchedWord ? assetUrl(matchedWord.image_asset) : null

  return (
    <main className="shell">
      <header className="masthead">
        <div className="masthead-top">
          <p className="eyebrow">Spin The Wheels</p>
          <span className="level-tag">{result.level.level_id}</span>
        </div>
        <h1>Make a word</h1>
      </header>
      <section className="picture-area" aria-label="Picture area">
        {rewardImage ? (
          <img src={rewardImage} alt={matchedWord ? `${matchedWord.word} reward` : 'Reward'} />
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
          />
        ))}
      </section>
      <button className="spin-button" type="button" onClick={() => void handleSpin()} disabled={gameState === 'Spinning'}>
        {gameState === 'Spinning' ? 'Spinning...' : 'Spin'}
      </button>
      <audio ref={audioRef} preload="auto" />
    </main>
  )
}