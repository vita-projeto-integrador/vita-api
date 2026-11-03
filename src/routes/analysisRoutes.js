import express from 'express'
import Authorization from '../middlewares/authMiddleware.js'
import analysisController from '../controllers/analysisController.js'
import uploadMiddleware from '../middlewares/uploadMiddleware.js'

const router = express.Router()

router.post('/analysis', Authorization, uploadMiddleware, analysisController.initAnalysis) // inicia análise de imagem

router.get('/analysis/map', Authorization, analysisController.getMapAnalysis) // pontos do mapa

router.get('/polling/analysis/:id', Authorization, analysisController.getPolling) // verifica progresso da análise

router.get('/analysis', Authorization, analysisController.getAllAnalysis) // listagem das análises

router.get('/analysis/:id', Authorization, analysisController.getAnalysisDetails) // monta relatório completo da análise

export default router