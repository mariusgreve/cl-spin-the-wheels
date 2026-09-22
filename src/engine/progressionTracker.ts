import type { Level } from './levelLoader'

export type ProgressionDecision = {
  shouldTransition: boolean
  distinctMatches: number
  threshold: number
  nextLevelId?: string
}

export class ProgressionTracker {
  private readonly level: Level
  private readonly distinctMatches = new Set<string>()
  private threshold: number
  private reachedThreshold = false
  private decisionEmitted = false

  constructor(level: Level) {
    this.level = level
    this.threshold = Math.ceil(level.word_list.length / 2)
  }

  recordMatch(wordId: string): ProgressionDecision {
    const isKnownWord = this.level.word_list.some((word) => word.word === wordId)
    if (!isKnownWord) {
      return this.buildDecision(this.distinctMatches.size)
    }

    this.distinctMatches.add(wordId)
    const distinctMatches = this.distinctMatches.size

    if (this.decisionEmitted) {
      return this.buildDecision(distinctMatches)
    }

    if (distinctMatches >= this.threshold) {
      this.reachedThreshold = true
      this.decisionEmitted = true
      return {
        shouldTransition: this.level.next_level_id !== undefined && this.level.next_level_id.trim() !== '',
        distinctMatches,
        threshold: this.threshold,
        nextLevelId: this.level.next_level_id,
      }
    }

    return this.buildDecision(distinctMatches)
  }

  hasReachedThreshold(): boolean {
    return this.reachedThreshold || this.distinctMatches.size >= this.threshold
  }

  getProgress(): { distinctMatches: number; threshold: number } {
    return { distinctMatches: this.distinctMatches.size, threshold: this.threshold }
  }

  private buildDecision(distinctMatches: number): ProgressionDecision {
    return {
      shouldTransition: false,
      distinctMatches,
      threshold: this.threshold,
      nextLevelId: this.level.next_level_id,
    }
  }
}
