import logger from "../../utils/logging";
import { PortfolioModel } from "../../database/models/portfolio.schema";

type ViewCountAggregatorOptions = {
	flushIntervalMs?: number;
	maxBatchSize?: number;
};

type ViewCountAggregator = {
	track: (username: string) => void;
	flush: () => Promise<void>;
	stop: () => void;
};

const DEFAULT_FLUSH_INTERVAL_MS = 5000;
const DEFAULT_MAX_BATCH_SIZE = 1000;

const createViewCountAggregator = (
	options: ViewCountAggregatorOptions = {}
): ViewCountAggregator => {
	const flushIntervalMs =
		options.flushIntervalMs ?? DEFAULT_FLUSH_INTERVAL_MS;
	const maxBatchSize = options.maxBatchSize ?? DEFAULT_MAX_BATCH_SIZE;
	const counts = new Map<string, number>();
	let flushing = false;

	const flush = async (): Promise<void> => {
		if (flushing || counts.size === 0) {
			return;
		}

		flushing = true;
		const entries = Array.from(counts.entries());
		counts.clear();

		try {
			await PortfolioModel.bulkWrite(
				entries.map(([username, count]) => ({
					updateOne: {
						filter: { username },
						update: { $inc: { views: count } },
					},
				})),
				{ ordered: false }
			);
		} catch (error) {
			logger.errors.error(error as Error);
		} finally {
			flushing = false;
		}
	};

	const track = (username: string) => {
		const current = counts.get(username) ?? 0;
		counts.set(username, current + 1);

		if (counts.size >= maxBatchSize) {
			void flush();
		}
	};

	const timer = setInterval(() => {
		void flush();
	}, flushIntervalMs);

	if (typeof timer.unref === "function") {
		timer.unref();
	}

	const stop = () => {
		clearInterval(timer);
	};

	return { track, flush, stop };
};

export { createViewCountAggregator, type ViewCountAggregator };
