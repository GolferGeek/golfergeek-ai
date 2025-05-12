/**
 * Test script for LLM-based agent routing
 * 
 * Tests the orchestrator's ability to route queries to the correct agent using LLM
 */
import axios from 'axios';
import { AgentCard, Message, Task, Artifact } from '../agents/a2a/types/a2a.types';

// Extended task interface that handles how we need to access artifact content
interface ExtendedTask extends Task {
  artifacts?: Array<Artifact & {
    type?: string;
    content?: string;
  }>;
}

const orchestratorUrl = 'http://localhost:3333/api/agents/a2a/orchestrator';
const vueCorePath = '/api/agents/a2a/vue-core';
const vuexPath = '/api/agents/a2a/vuex';

// Test queries that should route to specific agents
const testQueries = [
  {
    query: 'How do Vue components work with the composition API?',
    expectedAgentName: 'Vue Core A2A Agent'
  },
  {
    query: 'What are the best practices for component communication?',
    expectedAgentName: 'Vue Core A2A Agent'
  },
  {
    query: 'Can you explain how to use computed properties in Vue?',
    expectedAgentName: 'Vue Core A2A Agent'
  },
  {
    query: 'How do I implement Vuex getters and access them in components?',
    expectedAgentName: 'Vuex A2A Agent'
  },
  {
    query: 'What is the difference between mutations and actions in Vuex?',
    expectedAgentName: 'Vuex A2A Agent'
  },
  {
    query: 'How should I structure a large state with modules in Vuex?',
    expectedAgentName: 'Vuex A2A Agent'
  }
];

/**
 * Calls the orchestrator with a message and returns the delegated agent and response
 */
async function callOrchestrator(query: string): Promise<{agentName: string, response: string}> {
  // Call the orchestrator with the query
  const response = await axios.post(
    orchestratorUrl,
    {
      jsonrpc: '2.0',
      method: 'tasks/send',
      params: {
        id: `llm-routing-task-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        message: {
          role: 'user',
          parts: [{ type: 'text', text: query }]
        }
      },
      id: 'llm-routing-test'
    },
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
  
  // Extract the task from the response
  const task = response.data.result as ExtendedTask;
  
  // Get the response text
  const responseMsg = task.status.message || { parts: [{ type: 'text', text: 'No response' }] };
  let responseText = '';
  for (const part of responseMsg.parts) {
    if (part.type === 'text') {
      responseText += part.text;
    }
  }
  
  // Extract agent name from the response text format: "{AgentName} responds:"
  const agentMatch = responseText.match(/^(.*?) responds:/);
  const agentName = agentMatch ? agentMatch[1] : 'Unknown';
  
  return {
    agentName: agentName,
    response: responseText
  };
}

/**
 * Run all test queries and report the results
 */
async function runLlmRoutingTests() {
  console.log('=== LLM-based Agent Routing Test ===\n');
  
  let passCount = 0;
  let totalTests = testQueries.length;
  
  // Run each test query
  for (let i = 0; i < testQueries.length; i++) {
    const { query, expectedAgentName } = testQueries[i];
    
    console.log(`Test ${i + 1}: "${query}"`);
    console.log(`Expected agent: ${expectedAgentName}`);
    
    try {
      // Call the orchestrator
      const { agentName, response } = await callOrchestrator(query);
      
      console.log(`Actual agent: ${agentName}`);
      console.log(`Response preview: ${response.substring(0, 100)}...`);
      
      // Check if the router selected the expected agent
      const passed = agentName.includes(expectedAgentName);
      console.log(`Result: ${passed ? 'PASS ✅' : 'FAIL ❌'}`);
      
      if (passed) {
        passCount++;
      }
    } catch (error) {
      console.error(`Error in test ${i + 1}:`, error instanceof Error ? error.message : String(error));
      console.log('Result: FAIL ❌');
    }
    
    console.log('\n---\n');
  }
  
  // Report overall results
  console.log('=== Test Summary ===');
  console.log(`Passed: ${passCount}/${totalTests} (${Math.round(passCount / totalTests * 100)}%)`);
  console.log(`Failed: ${totalTests - passCount}/${totalTests}`);
}

// Call the main test function
runLlmRoutingTests().catch(error => {
  console.error('Test failed with error:', error);
}); 