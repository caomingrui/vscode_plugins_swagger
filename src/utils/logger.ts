import dayjs from 'dayjs';
type LoggerType = 'log' | 'error' | 'warn';

class LogStore {
    private moudels: Record<number, {
        time: string;
        type: LoggerType;
        msg: any[];
    }>
    constructor() {
        this.moudels = {}
    }

    setMoudels(args: any[], type: LoggerType) {
        // 获取当前时间
        let time = dayjs().format('YYYY-MM-DD HH:mm:ss');
        let timeStamp = dayjs().valueOf();
        const record = {
            time,
            type,
            msg: args
        }
        this.moudels[timeStamp] = record;
    }

    // 重置值
    resetting(data = {}) {
        this.moudels = data;
    }
}

export const log_store = new LogStore()

export class logger {
    static debug(...args: any[]) {
        console.log(...args);
    }

    static log(...args: any[]) {
        if (!args.length) return
        log_store.setMoudels(args, 'log')
    }

    static warn (...args: any[]) {
        if (!args.length) return
        log_store.setMoudels(args, 'warn')
    }

    static error (...args: any[]) {
        if (!args.length) return
        log_store.setMoudels(args, 'error')
    }
}