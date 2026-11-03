import express from 'express';
import { appRoutes } from './routes/index.js';
import { errorHandler } from './middlewares/error-handler.js';
import path from 'node:path';
// instancia do express
const app = express();
// configs basicas
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// serve pasta estática /storage
const storagePath = path.resolve(import.meta.dirname, '../storage');
app.use('/storage', express.static(storagePath));
// rotas da API
app.use('/api', appRoutes);
app.get('/', (req, res) => {
    res.redirect('/api/health');
});
// middleware de erro global
app.use(errorHandler);
export default app;
