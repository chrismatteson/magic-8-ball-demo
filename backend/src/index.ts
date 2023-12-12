import { HandleRequest, HttpRequest, HttpResponse, Llm, InferencingModels } from "@fermyon/spin-sdk"

const encoder = new TextEncoder()
const decoder = new TextDecoder("utf-8")

export const handleRequest: HandleRequest = async function (request: HttpRequest): Promise<HttpResponse> {
  try {
    const requestData = JSON.parse(decoder.decode(request.body));
    console.log(requestData);

    const question = requestData.question || "";
    const temperature = parseFloat(requestData.temperature) || 0.25;
    const maxTokens = parseInt(requestData.maxTokens) || 20;
    const top_p = parseFloat(requestData.top_p) || 0.25;
    const top_k = parseInt(requestData.top_k) || 5;

    if (question.length === 0) {
      return {
        status: 400,
        body: encoder.encode("No question asked").buffer
      };
    }

    const answerJson = `{"answer": "${answer(question, temperature, maxTokens, top_p, top_k)}"}`;

    return {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: encoder.encode(answerJson).buffer
    };
  } catch (error: any) {
    return {
      status: 500,
      body: encoder.encode(`Error: ${error.message}`).buffer
    };
  }
}

function answer(question: string, temperature: number, maxTokens: number, top_p: number, top_k: number): string {
  const prompt = `<s>[INST] <<SYS>>
        You are acting as a Magic 8 Ball that predicts the answer to a questions about events now or in the future.
        Your tone should be expressive yet polite.
        Your answers should be 10 words or less.
        Prefix your response with 'Answer:'.
        <</SYS>>
        ${question}[/INST]`;

  const response = Llm.infer(InferencingModels.Llama2Chat, prompt, {
    maxTokens,
    repeatPenalty: 1.5,
    repeatPenaltyLastNTokenCount: 20,
    temperature,
    topK: top_k,
    topP: top_p,
  }).text;

  console.log(response)

  // Parse the response to remove the expected `Answer:` prefix from the response
  const answerPrefix = "Answer:";
  let trimmedResponse = response.trim();
  if (trimmedResponse.startsWith(answerPrefix)) {
    trimmedResponse = trimmedResponse.substring(answerPrefix.length);
  }

  return trimmedResponse;
}
