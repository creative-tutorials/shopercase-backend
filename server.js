export default function Server({app, PORT}) {
  app.listen(PORT, () => {
    console.log(`Server started on PORT: ${PORT}`);
  });
}
