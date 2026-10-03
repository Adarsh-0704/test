class SplitMix64 {
    private state: bigint;

    constructor(seed: bigint) {
        this.state = seed;
    }

    next(): bigint {
        this.state += 0x9e3779b97f4a7c15n;

        let z = this.state;
        z = (z ^ (z >> 30n)) * 0xbf58476d1ce4e5b9n;
        z = (z ^ (z >> 27n)) * 0x94d049bb133111ebn;
        z ^= z >> 31n;

        return z & 0xffffffffffffffffn;
    }
}

export { SplitMix64 };

