import express from 'express';

const app = express();

app.use((req, res) => {
    res.redirect('https://' + req.headers.host + req.url);
});

export default app;
