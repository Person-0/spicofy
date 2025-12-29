const consolelog = console.log.bind(console);

declare global {
  interface Console {
    pause(): void;
    resume(): void;
  }
}

let isLogPaused = false;
let logq: any[][] = [];

global.console.pause = () => {
    isLogPaused = true;
}

global.console.resume = () => {
    isLogPaused = false;
    while(logq.length) {
        const item = logq.shift() as any;
        console.log(...item);
    }
}

global.console.log = (...e: any[]) => {
    if(isLogPaused) {
        logq.push(e);
        return;
    }
    consolelog(...e);
}

export {};