import { GoogleGenAI } from "@google/genai";

const getClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        console.warn("Gemini API Key is missing. AI features will be disabled.");
        return null;
    }
    return new GoogleGenAI({ apiKey });
};

export const generatePartnerEmail = async (
    partnerName: string,
    passengerCount: number,
    tripDetails: string,
    overbookedPaxNames: string[]
): Promise<string> => {
    const ai = getClient();
    if (!ai) return "Erro: Chave de API ausente.";

    try {
        const prompt = `
        Você é um assistente de uma agência de turismo receptivo.
        Escreva um e-mail profissional, educado e objetivo para uma agência parceira chamada "${partnerName}".
        
        Solicitação: Temos uma situação de overbooking e precisamos transferir ${passengerCount} passageiros para o veículo deles, se disponível.
        
        Detalhes da Viagem: ${tripDetails}
        Passageiros: ${overbookedPaxNames.join(', ')}
        
        O tom deve ser colaborativo e um pouco urgente, mas muito profissional. 
        Inclua espaços reservados para [Data] e [Seu Nome] se não estiver evidente.
        Escreva o e-mail em Português do Brasil.
        Retorne apenas o corpo do texto do e-mail.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text || "Não foi possível gerar o rascunho do e-mail.";
    } catch (error) {
        console.error("Gemini API Error:", error);
        return "Erro ao gerar o rascunho. Por favor, tente novamente mais tarde.";
    }
};