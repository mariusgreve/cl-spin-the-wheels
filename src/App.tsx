import { useEffect, useMemo, useRef, useState } from 'react'
import levelData from './assets/levels/level-1.json'
import { loadLevel, type WordDefinition } from './engine/levelLoader'
import { createSpinnerState, getCurrentLetter, resolveWordMatch, settleSpinnerToLetter, spinForWord, type SpinnerState } from './engine/spinner'
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
  const [status, setStatus] = useState('Level loaded and ready for the first game milestone.')
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (!result.level) {
      return
    }

    setSpinnerStates(result.level.spinners.map(createSpinnerState))
    setMatchedWord(null)
    setStatus('Level loaded and ready for the first game milestone.')
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

  const handleSpin = () => {
    const currentWord = resolveWordMatch(result.level, spinnerStates)
    const pickedWord = spinForWord(result.level, currentWord?.word)
    const nextSpinners = result.level.spinners.map((spinner, index) => {
      const nextSpinner = createSpinnerState(spinner)
      settleSpinnerToLetter(nextSpinner, pickedWord.letters[index])
      return nextSpinner
    })

    setSpinnerStates(nextSpinners)

    const match = resolveWordMatch(result.level, nextSpinners)
    if (match) {
      setMatchedWord(match)
      setStatus(`You matched "${match.word}"!`)
      return
    }

    setMatchedWord(null)
    setStatus('Not a word yet. Try another spin.')
  }

  const rewardImage = matchedWord ? assetUrl(matchedWord.image_asset) : null

  return (
    <main className="shell">
      <header className="masthead">
        <p className="eyebrow">Spin The Wheels</p>
        <h1>Make a word</h1>
        <span className="level-tag">{result.level.level_id}</span>
      </header>
      <section className="picture-area" aria-label="Picture area">
        {rewardImage ? (
          <img src={rewardImage} alt={matchedWord ? `${matchedWord.word} reward` : 'Reward'} />
        ) : (
          <div className="picture-placeholder" aria-label="No reward yet">?</div>
        )}
      </section>
      <section className="spinner-row" aria-label="Letter wheels">
        {spinnerStates.map((spinner) => (
          <div className="spinner-slot" key={spinner.id}>
            <span>{getCurrentLetter(spinner)}</span>
          </div>
        ))}
      </section>
      <button className="spin-button" type="button" onClick={handleSpin}>Spin</button>
      <p className="status" role="status">{status}</p>
      <audio ref={audioRef} preload="auto" />
    </main>
  )
}