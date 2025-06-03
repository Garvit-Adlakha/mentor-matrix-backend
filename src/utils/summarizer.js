
/**
 * Gets a summary of the project description using the summarizer API
 * @param {Object} projectDetails - The project details object
 * @returns {Promise<string>} - A promise that resolves to the summary text
 */
export const getSummary = async (projectDetails) => {
  try {
    // Check if the summarizer API is running
    const apiUrl = process.env.SUMMARIZER_API_URL || 'http://localhost:8080';
    
    // Set timeout to prevent long waiting time if API is not available
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${apiUrl}/api/summarize-project/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        project: {
          title: projectDetails.title,
          description: {
            abstract: projectDetails.description?.abstract || "",
            problemStatement: projectDetails.description?.problemStatement || "",
            proposedMethodology: projectDetails.description?.proposedMethodology || "",
            expectedOutcomes: "Not specified",
            relevance: "Not specified",
            techStack: projectDetails.description?.techStack || []
          },
          team_members: projectDetails.teamMembers?.map(member => 
            typeof member === 'object' ? member.name || member._id : member
          ) || []
        },
        max_length: 150
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to get summary: ${errorText}`);
      return null;
    }

    const data = await response.json();
    return data.summary;
  } catch (error) {
    // Check if the error is due to API not being available
    if (error.name === 'AbortError') {
      console.error('Summarizer API request timed out');
    } else {
      console.error('Error getting project summary:', error);
    }
    return null;
  }
};