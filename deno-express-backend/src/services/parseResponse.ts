export default function parseResponse(responseBuffer: string) {
    const lines = responseBuffer.split("\n").filter((line: string) => line.trim().length);
    let thinking = "";
    let answer = "";
    let inThinking = false;

    for (const line of lines) {
        try {
            const obj = JSON.parse(line);
            let text = obj.response;

            if (text.includes("<think>")) {
                inThinking = true;
                text = text.replace("<think>", "");
            }
            if (text.includes("</think>")) {
                inThinking = false;
                text = text.replace("</think>", "");
            }

            if (inThinking) {
                thinking += text;
            } else {
                answer += text;
            }
        } catch (err) {
            console.error("Error parsing line:", line, err);
        }
    }
    return { thinking: thinking.trim(), answer: answer.trim() };
}
