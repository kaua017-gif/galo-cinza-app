import express from 'express';
import axios from 'axios';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function gerarEbookCompleto(temaDoEbook) {
  const prompt = `Você é um infoprodutor de sucesso. Crie um e-book completo, direto ao ponto (estilo microlearning), sobre o tema: "${temaDoEbook}". O e-book deve conter: Título chamativo, Introdução impactante e 3 Capítulos práticos com estratégias acionáveis.`;
  
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });
    return response.choices[0].message.content;
  } catch (error) {
    console.error("Erro na OpenAI ao gerar e-book:", error);
    throw error;
  }
}

async function cadastrarNaPlataforma(dadosDoProduto, tokenDoUsuario) {
  const URL_API = 'https://api.cakto.com.br/v1/products';
  
  const payload = {
    title: dadosDoProduto.titulo,
    description: dadosDoProduto.descricao,
    price: 2990,
    currency: 'BRL',
    payment_mode: 'one_time',
    content_url: dadosDoProduto.pdfUrl
  };
  
  try {
    const response = await axios.post(URL_API, payload, {
      headers: {
        'Authorization': `Bearer ${tokenDoUsuario}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error("Erro na API da plataforma de vendas:", error.response?.data || error.message);
    throw error;
  }
}

async function gerarRoteirosVideo(temaDoEbook) {
  const prompt = `Você é um especialista em algoritmos do TikTok, Instagram Reels e YouTube Shorts. Com base no tema "${temaDoEbook}", crie um roteiro de vídeo curto (menos de 60 segundos) altamente viral. Indique o que falar (Áudio) e o que mostrar na tela (Visual), divididos em Gancho de 3 segundos, Conteúdo e Chamada para Ação (CTA).`;
  
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
    });
    return response.choices[0].message.content;
  } catch (error) {
    console.error("Erro na OpenAI ao gerar roteiro:", error);
    throw error;
  }
}

async function gerarEstrategiaGrupos(temaDoEbook, linkDeVenda) {
  const prompt = `Com base no tema do produto "${temaDoEbook}", faça o seguinte: 1. Liste quais os 3 melhores tipos de grupos/comunidades (Facebook, Reddit ou Telegram) onde os compradores desse assunto interagem. 2. Crie uma postagem no estilo "Indicação Inocente": uma mensagem curta contando uma história rápida de como resolveu um problema usando um guia digital e deixando o link (${linkDeVenda}) de forma 100% natural, sem parecer propaganda.`;
  
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });
    return response.choices[0].message.content;
  } catch (error) {
    console.error("Erro na OpenAI ao gerar estratégia de grupos:", error);
    throw error;
  }
}

app.post('/api/criar-produto', async (req, res) => {
  const { tema, tokenPlataforma } = req.body;
  
  if (!tema || !tokenPlataforma) {
    return res.status(400).json({ 
      sucesso: false, 
      erro: "Tema e Token são obrigatórios." 
    });
  }
  
  try {
    const textoDoLivro = await gerarEbookCompleto(tema);
    const urlDoPdfGerado = "https://seu-site.com/pdfs/ebook-gerado.pdf";
    
    const infoVenda = await cadastrarNaPlataforma({
      titulo: `Guia Rápido: ${tema}`,
      descricao: `Aprenda de forma prática tudo sobre ${tema}.`,
      pdfUrl: urlDoPdfGerado
    }, tokenPlataforma);
    
    const linkDeVendaFinal = infoVenda.checkout_url || "https://kiwify.com.br/checkout/exemplo-gerado";
    
    const roteiroVideo = await gerarRoteirosVideo(tema);
    const estrategiaGrupos = await gerarEstrategiaGrupos(tema, linkDeVendaFinal);
    
    res.status(200).json({
      sucesso: true,
      checkoutUrl: linkDeVendaFinal,
      videoScript: roteiroVideo,
      marketingComunidades: estrategiaGrupos
    });
  } catch (error) {
    console.error("Erro completo:", error);
    res.status(500).json({ 
      sucesso: false, 
      erro: "Houve uma falha interna na criação ou integração do produto." 
    });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor Back-end rodando com sucesso na porta ${PORT}`);
});
