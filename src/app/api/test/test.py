def llm_chain(user_input, context_window):
    generated_code = code_generator(user_input)
    context_window.append({
        "role": "assistant",
        "content": [
            {
                "text": generated_code,
                "type": "text"
            }
        ]
    })

    # 1. 라우팅
    current_step = content_router(context_window)
    concept_feedback = ""
    if current_step == "1.1":
        # 1.1 콘텐츠의 프롬프트 실행
        concept_feedback = content1_1_concept_generator(context_window)
        pass
    if current_step == "1.2":
        # 1.2 콘텐츠의 프롬프트 실행
        concept_feedback = content1_2_concept_generator(context_window)
        pass
    elif current_step == "1.3":
        # 1.3 콘텐츠의 프롬프트 실행
        concept_feedback = content1_3_concept_generator(context_window)

    # 2. 라우팅과 동시에 프롬프트 피드백
    prompt_feedback = prompt_feedback_generator(user_input)

    # 3. 개념 피드백과 합치기
    combined_feedback = feedback_combiner(concept_feedback, prompt_feedback)
    return combined_feedback
    # 코드 조작하기

def code_generator(user_input):
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "system",
                "content": [
                    {
                        "text": f"""You are code generating AI. Output code""",
                        "type": "text"
                    }
                ]
            },
            {
                "role": "user",
                "content": [
                    {
                        "text": f"{user_input}",
                        "type": "text"
                    }
                ]
            }
        ],
        temperature=1,
        max_tokens=4095,
        top_p=1,
        frequency_penalty=0,
        presence_penalty=0
    )
    return response.choices[0].message.content

def content1_1_concept_generator(context_window):
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "system",
                "content": [
                    {
                        "text": "생략",
                        "type": "text"
                    }
                ]
            }
        ],
        temperature=1,
        max_tokens=256,
        top_p=1,
        frequency_penalty=0,
        presence_penalty=0
    )
    return response.choices[0].message.content

def content1_1_concept_generator(context_window):
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "system",
                "content": [
                    {
                        "text": "생략",
                        "type": "text"
                    }
                ]
            }
        ],
        temperature=1,
        max_tokens=256,
        top_p=1,
        frequency_penalty=0,
        presence_penalty=0
    )
    return response.choices[0].message.content
def content1_2_concept_generator(context_window):
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "system",
                "content": [
                    {
                        "text": "생략",
                        "type": "text"
                    }
                ]
            }
        ],
        temperature=1,
        max_tokens=256,
        top_p=1,
        frequency_penalty=0,
        presence_penalty=0
    )
    return response.choices[0].message.content
def content1_3_concept_generator(context_window):
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "system",
                "content": [
                    {
                        "text": "생략",
                        "type": "text"
                    }
                ]
            }
        ],
        temperature=1,
        max_tokens=256,
        top_p=1,
        frequency_penalty=0,
        presence_penalty=0
    )
    return response.choices[0].message.content
def content_router(context_window):
    # https://platform.openai.com/playground/p/QJK7ylhprbi5avIU88mMhaih
    # messages는 role (system, user, assistant)와 content(text)로 이루어져 있다.
    # user인 경우는 S: {content}, assistant인 경우는 T: {content}의 문자열로 만들어서 stringified_script에 넣어주면 된다.
    stringified_script = ""
    for message in context_window:
        if message["role"] == "user":
            stringified_script += "S: " + message["content"][0]["text"] + "\n"
        elif message["role"] == "assistant":
            stringified_script += "T: " + message["content"][0]["text"] + "\n"

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
        {
            "role": "system",
            "content": [
            {
                "text": f"""생략""",
                "type": "text"
            }
            ]
        },
        {
            "role": "user",
            "content": [
            {
                "text": "NEXT Content number is:",
                "type": "text"
            }
            ]
        }
        ],
        temperature=0,
        max_tokens=4095,
        top_p=1,
        frequency_penalty=0,
        presence_penalty=0
    )
    return response.choices[0].message.content

def prompt_feedback_generator(user_input: str):
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
        {
            "role": "system",
            "content": [
            {
                "text": f"생략",
                "type": "text"
            }
            ]
        },
        {
            "role": "user",
            "content": [
            {
                "text": "FEEDBACK:",
                "type": "text"
            }
            ]
        }
        ],
        temperature=0.3,
        max_tokens=4095,
        top_p=1,
        frequency_penalty=0,
        presence_penalty=0
    )

    return response.choices[0].message.content
def feedback_combiner(concept_feedback, prompt_feedback):
        # concept과 프롬프트를 합쳐서 하나의 결과로 뽑아내기
        return concept_feedback + prompt_feedback
