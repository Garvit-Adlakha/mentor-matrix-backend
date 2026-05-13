
import Gemini from './Gemini.js';

/**
 * Gets a summary of the project description using Gemini model
 * @param {Object} projectDetails - The project details object
 * @returns {Promise<string|null>} - A promise that resolves to the summary text or null if unavailable
 */
export const getSummary = async (projectDetails) => {
  try {
    const prompt = `Provide a concise summary (max 150 words) of the following project:

Title: ${projectDetails.title || "Not specified"}
Abstract: ${projectDetails.description?.abstract || "Not specified"}
Problem Statement: ${projectDetails.description?.problemStatement || "Not specified"}
Proposed Methodology: ${projectDetails.description?.proposedMethodology || "Not specified"}
Tech Stack: ${Array.isArray(projectDetails.description?.techStack) ? projectDetails.description.techStack.join(", ") : "Not specified"}
Team Members: ${projectDetails.teamMembers?.map(member => 
  typeof member === 'object' ? member.name || member._id : member
).join(", ") || "Not specified"}

Please provide a clear and concise summary of this project.`;

    const response = await Gemini({ content: prompt });
    return response || null;
  } catch (error) {
    console.warn('Summary generation unavailable (quota/rate limit):', error.message);
    return null;
  }
};