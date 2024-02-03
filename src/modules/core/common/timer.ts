export class Timer {
    public startTime: number
    private timerDifferenceStopStart: number
    constructor() {
        this.startTime = performance.now()
        this.timerDifferenceStopStart = 0
    }

    public start() {
        this.startTime = performance.now()
    }

    public stop() {
        this.timerDifferenceStopStart = performance.now() - this.startTime
        return this.getTimeInMilliseconds()
    }

    public getTimeInMilliseconds() {
        return Math.round(this.timerDifferenceStopStart)
    }
}
