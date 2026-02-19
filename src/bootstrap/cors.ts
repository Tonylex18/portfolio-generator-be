import cors, { CorsOptions } from "cors";
import { Application } from "express";


const corsOptions: CorsOptions = {
	credentials: true,
	// origin: ["http://localhost:3000","http://localhost:5173", "https://lnaid.mistech.io", "https://lnaidbe.mistech.io/", "https://lnaid.net","https://lnaid.net/"],
	origin: "*",
	methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
	allowedHeaders: ["Content-Type", "Authorization"],
  };
  

const handleCors = (app: Application) => {
	app.use(cors(corsOptions));
};

export default handleCors;
