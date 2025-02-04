

export default class CircuitBreaker {
    private state : "OPEN" | "CLOSED" | "HALF_OPEN" = "CLOSED";
    private failures: number = 0;
    private lastFailureTime: number =  0;

    constructor(private threshold: number, private timeout: number) {};

    async execute<T>(operation: Promise<T>) : Promise<T> {
        if(this.state === "OPEN") {
            // stabilization timeout 
            if(Date.now() - this.lastFailureTime > this.timeout) {
                this.state = "HALF_OPEN"; // verify if cache has stabilized or not
            } else {
                throw new Error("Circuit is OPEN");
            }
        }

        try {
            const result = await operation;
            if(this.state === "HALF_OPEN") {
                this.state = "CLOSED";
                this.failures = 0;
            }
            return result;
        } catch (error) {
            this.failures++;
            this.lastFailureTime = Date.now();
            if(this.failures >= this.threshold) {
                this.state = "OPEN";
            }
            throw error;
        }
    }
}