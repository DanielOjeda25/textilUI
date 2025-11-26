export interface ViewportState {
    scale: number
    minScale: number
    maxScale: number
    x: number
    y: number
    screenWidth: number
    screenHeight: number
    contentWidth: number
    contentHeight: number
}

export interface ViewportActions {
    setScale(scale: number, cx?: number, cy?: number): void
    setPosition(x: number, y: number): void
    fitToScreen(): void
    resetView(): void
}

