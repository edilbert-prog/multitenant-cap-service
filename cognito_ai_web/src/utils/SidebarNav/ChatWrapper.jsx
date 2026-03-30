import React, { useState } from 'react';
import { apiRequest } from '../helpers/ApiHelper';
import ChatBot from './ChatBot';

const ChatWrapper = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! Welcome to our IT Support Assistant. I'm here to help you with technical issues.",
      sender: "bot",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    },
    {
      id: 2,
      text: "What type of assistance do you need today?",
      sender: "bot",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      options: ['Incident Management']
    }
  ]);

  const [currentFlow, setCurrentFlow] = useState('assistant_selection');
  const [isLoading, setIsLoading] = useState(false);

  const addMessage = (text, sender = "bot", options = null) => {
    const newMessage = {
      id: Date.now(),
      text: String(text),
      sender: sender,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      ...(options && { options })
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  };

  // Categorize user queries
  const categorizeQuery = (query) => {
    const lower = String(query).toLowerCase();
    
    if (lower.includes('login') || lower.includes('access') || lower.includes('password')) {
      return { type: 'Technical', incident: 'login_issues', category: 'Login Issues' };
    }
    if (lower.includes('slow') || lower.includes('performance') || lower.includes('lag')) {
      return { type: 'Performance', incident: 'performance_slow', category: 'Performance Issues' };
    }
    if (lower.includes('crash') || lower.includes('error') || lower.includes('broken')) {
      return { type: 'System', incident: 'system_crash', category: 'System Errors' };
    }
    if (lower.includes('network') || lower.includes('connection') || lower.includes('internet')) {
      return { type: 'Network', incident: 'network_connectivity', category: 'Network Issues' };
    }
    
    return null;
  };

  // Fetch solutions from API
  const fetchSolutions = async (incidentType, incident) => {
    try {
      setIsLoading(true);
      const response = await apiRequest("/GetIncidentSolutions", {
        IncidentType: incidentType,
        Incident: incident
      });
      return response.ResponseData || [];
    } catch (error) {
      console.error('Error fetching solutions:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Update solution score
  const updateScore = async (incidentId, isHelpful) => {
    if (!isHelpful) return;
    
    try {
      await apiRequest("/UpdateIncidentScore", {
        IncidentId: incidentId,
      });
      console.log(`Updated score for ${incidentId}`);
    } catch (error) {
      console.error('Error updating score:', error);
    }
  };

  // Handle user messages (both typed and option clicks)
  const handleUserMessage = async (messageData) => {
    let userMessage = '';
    
    // Handle different input types
    if (typeof messageData === 'string') {
      userMessage = messageData;
    } else if (messageData && messageData.text) {
      userMessage = messageData.text;
    } else {
      userMessage = String(messageData);
    }

    // Add user message to chat
    addMessage(userMessage, "user");

    // Add loading message for API calls
    let loadingMessage = null;
    if (currentFlow === 'incident_management' && !userMessage.includes('HELPFUL') && !userMessage.includes('NOT HELPFUL') && !userMessage.toLowerCase().includes('new issue') && !userMessage.toLowerCase().includes('start over')) {
      loadingMessage = addMessage("Searching for solutions...", "bot");
    }

    // Check for feedback commands
    if (userMessage.includes('HELPFUL') || userMessage.includes('NOT HELPFUL')) {
      const isHelpful = userMessage.includes('HELPFUL') && !userMessage.includes('NOT HELPFUL');
      const parts = userMessage.split(' ');
      const incidentId = parts[parts.length - 1];
      
      // Remove loading message if exists
      if (loadingMessage) {
        setMessages(prev => prev.filter(msg => msg.id !== loadingMessage.id));
      }
      
      await updateScore(incidentId, isHelpful);
      
      if (isHelpful) {
        addMessage("Thank you! I've updated the solution rating. Anything else I can help with?", "bot", 
          ['Try Another Issue', 'Start Over']);
      } else {
        addMessage("Sorry that didn't help. You can try other solutions or report a new issue.", "bot", 
          ['Try Another Issue', 'Start Over']);
      }
      return;
    }

    // Handle restart commands
    if (userMessage.toLowerCase().includes('new issue') || userMessage.toLowerCase().includes('start over')) {
      if (loadingMessage) {
        setMessages(prev => prev.filter(msg => msg.id !== loadingMessage.id));
      }
      setCurrentFlow('incident_management');
      addMessage("What type of issue are you experiencing?", "bot", 
        ['Login Problems', 'System Slow', 'System Crash/Error', 'Network Issues']);
      return;
    }

    // Process based on current flow
    if (currentFlow === 'assistant_selection') {
      if (userMessage.toLowerCase().includes('incident')) {
        setCurrentFlow('incident_management');
        addMessage("Perfect! I'll help with incident management. What type of issue are you experiencing?", "bot",
          ['Login Problems', 'System Slow', 'System Crash/Error', 'Network Issues']);
      } else {
        addMessage("I'm specialized in Incident & Defect Management. Please select an option:", "bot",
          ['Incident Management']);
      }
    } 
    else if (currentFlow === 'incident_management') {
      const category = categorizeQuery(userMessage);
      
      if (category) {
        // Remove loading message and add progress message
        if (loadingMessage) {
          setMessages(prev => prev.filter(msg => msg.id !== loadingMessage.id));
        }
        
        addMessage(`I understand you're having ${category.category.toLowerCase()}. Let me find solutions for you...`, "bot");
        
        // Fetch solutions
        const solutions = await fetchSolutions(category.type, category.incident);
        
        if (solutions.length > 0) {
            let solutionsText = `Found ${solutions.length} solution(s):\n\n`;
            let feedbackOptions = [];
        
            solutions.forEach((sol, index) => {
                const score = Number(sol.Score) || 1;
                const solutionDetails = sol.Solution || sol.Description || 'No details available';
        
                // Highlighting using **asterisks** to simulate bold
                solutionsText += `${index + 1}. Solution ${sol.IncidentId} \n Rating: ${score.toFixed(1)}/10\n`;
                solutionsText += `**${solutionDetails}**\n`;
        
                // Create feedback options
                feedbackOptions.push(`✓ Solution ${sol.IncidentId} Helped`);
                feedbackOptions.push(`✗ Solution ${sol.IncidentId} Didn't Help`);
            });
        
            solutionsText += "Please let me know if any of these solutions helped:";
            feedbackOptions.push('Try Another Issue');
            addMessage(solutionsText, "bot", feedbackOptions);
        } else {
          addMessage(`No specific solutions found. Here are some general troubleshooting steps:\n\n1. Restart the application\n2. Clear browser cache\n3. Check network connection\n4. Try different browser\n5. Contact IT support\n\nWould you like to try another issue type?`, "bot",
            ['Try Another Issue', 'Start Over']);
        }
      } else {
        if (loadingMessage) {
          setMessages(prev => prev.filter(msg => msg.id !== loadingMessage.id));
        }
        addMessage("Please select one of the specific issue types:", "bot",
          ['Login Problems', 'System Slow', 'System Crash/Error', 'Network Issues']);
      }
    }
  };

  // Handle option clicks (convert to format expected by handleUserMessage)
  const handleOptionClick = async (option) => {
    // Convert option text to expected format for feedback
    if (option.includes('✓') && option.includes('Helped')) {
      const parts = option.split(' ');
      const solutionId = parts.find(part => part.includes('-'));
      //console.log("Solution ID:", solutionId);
      return handleUserMessage(`HELPFUL ${solutionId}`);
    } else if (option.includes('✗') && option.includes("Didn't Help")) {
      const parts = option.split(' ');
      const solutionId = parts.find(part => part.includes('-'));
      return handleUserMessage(`NOT HELPFUL ${solutionId}`); 
    }
    
    // Handle regular options
    return handleUserMessage(option);
  };

  return (
    <div>
      <ChatBot
        messages={messages}
        onUserMessage={handleUserMessage}
        onOptionClick={handleOptionClick}
        fromColor="#DCF8C6"  // WhatsApp-like green for user messages
        toColor="#F0F0F0"    // Light gray for bot messages
      />
    </div>
  );
};

export default ChatWrapper;