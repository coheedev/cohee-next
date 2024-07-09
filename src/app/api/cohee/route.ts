// import neo4jDriver from "@/utils/Neo4j";
import openai from "@/utils/OpenAI";
import { OpenAIStream, StreamingTextResponse } from "ai";
import {
  ChatCompletionMessageParam,
  ChatCompletionAssistantMessageParam,
} from "openai/resources/chat/completions";

export const runtime = "edge";

export async function POST(request: Request) {
  const { sectionIds, query, sectionTitle } = await request.json();

  // Context 생성
  const contextMessages: ChatCompletionAssistantMessageParam[] = [];

  // OpenAI 메시지 생성
  const messages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content:
        '[역할]당신은 대한민국 행정법의 20년차 전문가이며, 특히 음주운전 행정심판에 대한 구체적인 지식과 경험을 가지고 있습니다. 음주운전 행정심판청구를 통해 의뢰인의 많은 승소를 이루어낸 경험이 있고, 모든 재결례를 꿰고 있습니다. \n[목표]이를 바탕으로  의뢰인의 현재 상황에 맞춰 승소하는 행정심판청구서를 작성합니다.\n[제공정보]당신이 이전에 정리한 "승소하는 행정심판청구서를 작성하는 가이드라인"을 제공해드리겠습니다.\n- 행정심판청구서에는 크게 [처분 경위], [감경되어야 하는 이유], [처분이 가혹한 이유] 그리고 [결론] 섹션으로 구분됩니다.\n- 행정심판청구서는 다음과 같은 형식과 구조를 따라야 합니다:\n"""## 1. 처분 경위\n### 1) 운전면허취득 및 운전경력\n#### 가. 운전면허취득\n#### 나. 운전경력 및 무사고 증명\n#### 때에 따라 추가적인 가족관계, 학력 등 기재\n### 2) 음주 및 처분 경위 (육하원칙에 따라 사건의 진행과정을 시작부터 끝까지 상세히 설명. 가, 나, 다,..., 사 등 문단 구분)\n\n## 2. 감경되어야 하는 이유 (육하원칙에 따라 처분의 부당성/위법성 상세히 설명)\n### 하위 소제목에는 1), 2), 3) 등으로 구분. 운전이 생계와 연관된 \b경우, 경제적 어려움, 가정의 어려움, 안전운전 경력, 성실성, 사회봉사, 단속 시 적극적 대응태도 등을 나누어 기재\n#### 하위 소제목에는 가, 나, 다..., 마 등으로 구분하여 상세하게 설명\n## 3. 처분이 가혹한 이유 (육하원칙에 따라 집행정지의 필요성 상세히 설명. 가, 나, 다,..., 사 등 문단 구분)\n## 4. 결론\n"""\n\n- 이전에 직접 작성하여 승소했던 행정심판청구서의 문구와 표현, 형식 등을 참고하여 작성합니다. 구체적인 내용은 가져오지 않습니다. 오직 의뢰인의 상황을 활용하여 수정하는 방식입니다.\n- 각 섹션을 하나씩 출력할 예정입니다. [처분 경위]를 요청하면 [처분경위] 섹션만 작성합니다.\n- 특정 소제목에서 정보가 제공되지 않아 모르는 내용은 "정보부족"이라고 표시합니다. 절대로 지어내서 생성하지 않습니다. 왜냐하면 거짓말은 행정심판청구의 패소로 이어지기 때문입니다. \n- 정보가 부족한 부분은 추가적인 피드백을 작성해줍니다.\n- 피드백은 소괄호를 사용해서 표시합니다.',
    },
    ...contextMessages,
    {
      role: "assistant",
      content: `의뢰인이 전달한 ${sectionTitle} 내용`,
    },
    {
      role: "user",
      content: query,
    },
  ];

  // OpenAI GPT 모델을 사용하여 응답 생성
  const response = await openai.chat.completions.create({
    model: "gpt-4-1106-preview",
    stream: true,
    messages: messages,
    temperature: 0,
    frequency_penalty: 0.5,
  });

  // 응답을 스트리밍 텍스트로 변환
  const stream = OpenAIStream(response);

  // 스트리밍 텍스트 응답 반환
  return new StreamingTextResponse(stream);
}
