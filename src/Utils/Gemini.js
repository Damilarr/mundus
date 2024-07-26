import { z } from "zod";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";

const parser = StructuredOutputParser.fromZodSchema(
  z.object({
    dataCollected: z
      .string()
      .describe(
        "What personal and non-personal data is being collected? (e.g., name, email, IP address, browsing history, device information)"
      ),
    purposeOfCollection: z
      .string()
      .describe(
        "Why is the data being collected? Describe the purpose breifly (e.g., service delivery, personalization, communication, analytics, marketing)."
      ),
    sharing: z
      .string()
      .describe(
        "With whom is the collected data shared? Specify the entities or categories of entities (e.g., third-party service providers, partners, legal authorities) and provide any specifics mentioned in the policy."
      ),
    userRights: z
      .string()
      .describe(
        "What rights do I have regarding my data?give a very brief List of the specific rights (e.g., access, correction, deletion, opt-out) and any procedures to exercise these rights."
      ),
    dataSecurity: z
      .string()
      .describe(
        "What measures are in place to protect my data? Describe the security practices very briefly."
      ),
    dataRetention: z
      .string()
      .describe(
        "How long will the website keep my data? Include any specified timeframes or criteria for data retention mentioned in the policy."
      ),
    tracking: z
      .string()
      .describe(
        "Does the site use cookies or similar tracking technologies, and for what purpose? Describe very briefly the types of tracking technologies used and their purposes (e.g., analytics, advertising, functionality)."
      ),
    contactInfo: z
      .string()
      .describe(
        "How can I contact the website with questions or concerns about my privacy?(Include detailed contact information such as email addresses, phone numbers,links and mailing addresses if available)"
      ),
    complianceScore: z
      .number()
      .describe(
        "How compliant is the website's policy with the key principles of the General Data Protection Regulation (GDPR)? Rate on a scale of 0 to 10 with 10 being very compliant, 0 being not compliant, and 5 being averagely compliant. Provide reasons for the rating."
      ),
  })
);
const getPrompt = async (linkToPolicy) => {
  const formatted_instructions = parser.getFormatInstructions();
  const prompt = new PromptTemplate({
    template:
      "Analyze the privacy policy available at the following link. Personalize the response as if you are addressing someone directly (e.g., using 'you' instead of 'user').ALWAYS REFER TO THE WEBSITE USING THE SECOND LEVEL DOMAIN OF THE LINK PROVIDED AS THIS IS VERY VERY VERY IMPORTANT!. Follow the instructions and format your response as specified, including detailed information from the policy wherever possible.\n{formatted_instructions}\n{link}",
    inputVariables: ["link"],
    partialVariables: { formatted_instructions },
  });
  const input = prompt.format({
    link: linkToPolicy,
  });
  return input;
};

export const analyze = async (linkToPolicy) => {
  console.log("running gem");
  const input = await getPrompt(linkToPolicy);
  const model = new ChatGoogleGenerativeAI({
    apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
    model: "gemini-1.5-flash",
    temperature: 0.2,
    maxOutputTokens: 2048,
  });
  const result = await model.invoke(input);
  try {
    return parser.parse(result.content.toString());
  } catch (error) {
    console.log(error, "could not parse the content");
  }
};
