import { Application } from "express";
import { config } from "../config/config";
import portfolioRoutes from "../modules/portmodel/portfolio.route";
import { HttpStatusCode } from "../shared/enums/http-status-code.tnum";
import globalErrorHandler from "../utils/global-errors/global-error.handler";

const handleRoutes = (app: Application) => {
	// health check
	app.get("/health", (_req, res) => {
		res.status(HttpStatusCode.OK).json({
			success: true,
			message: "Server is up and running",
		});
	});

	const basePath = `/api/v${config.defaults.version}`;
	app.use(`${basePath}/portfolios`, portfolioRoutes);

	app.use(globalErrorHandler);
};

// `/api/${config.defaults.version}`
export { handleRoutes };
