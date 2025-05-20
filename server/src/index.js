import cors from 'cors';
import express from 'express';

const app = express();
const port = 3001;

app.use(cors({
  origin: ['http://localhost:5173']
}));

app.use(express.json());

app.get('/api/data', (req, res) => {
  res.json({ message: "Vite + Express全栈数据" })
});

app.listen(port, () => {
  console.log(`Express服务器运行在 http://localhost:${port}`)
});