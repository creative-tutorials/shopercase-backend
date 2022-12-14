export default function CorsJS ({ app, cors })  {
  app.use(
    cors({
      origin: ["http://localhost:4000", "http://localhost:5000"],
    })
  );
};
