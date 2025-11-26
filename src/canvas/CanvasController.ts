export class CanvasController {
  private el?: HTMLElement
  mount(el: HTMLElement) {
    this.el = el
  }
  destroy() {
    if (this.el) {
      this.el.innerHTML = ''
    }
    this.el = undefined
  }
}
