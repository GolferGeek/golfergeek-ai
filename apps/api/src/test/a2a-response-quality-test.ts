import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

// Constants
const baseUrl = 'http://localhost:3333/api';
const orchestratorUrl = `${baseUrl}/agents/a2a/orchestrator`;

// Test cases for different agent types
const testCases = [
  // Vuex test cases
  {
    query: 'How do Vuex getters work?',
    expectedAgentName: 'Vuex A2A Agent',
    agentType: 'Vuex'
  },
  {
    query: 'What is the difference between mutations and actions in Vuex?',
    expectedAgentName: 'Vuex A2A Agent',
    agentType: 'Vuex'
  },
  {
    query: 'How should I structure a large state with modules in Vuex?',
    expectedAgentName: 'Vuex A2A Agent',
    agentType: 'Vuex'
  },
  // Vue Core test cases
  {
    query: 'How do I use Vue directives?',
    expectedAgentName: 'Vue Core A2A Agent',
    agentType: 'Vue Core'
  },
  {
    query: 'Explain Vue component lifecycle hooks',
    expectedAgentName: 'Vue Core A2A Agent',
    agentType: 'Vue Core'
  }
];

/**
 * Create and process a task through the orchestrator
 */
async function createAndProcessTask(query: string): Promise<string> {
  console.log(`Creating task for query: "${query}"`);
  
  const response = await axios.post(orchestratorUrl, {
    jsonrpc: "2.0",
    id: `quality-test-${Date.now()}`,
    method: "tasks/send",
    params: {
      id: `quality-test-${Date.now()}`,
      message: {
        role: "user",
        parts: [
          {
            type: "text",
            text: query
          }
        ]
      }
    }
  });
  
  return response.data.result.response;
}

/**
 * Check if a response contains actual content (not just "I don't have information")
 */
function hasActualContent(response: string): boolean {
  const noInfoPatterns = [
    /I don't have (enough |that |the |specific |detailed |complete |any )?information/i,
    /I cannot (provide|answer)/i,
    /I (do not|don't) have (access|enough data)/i,
    /no (specific|detailed) information/i,
    /information (is|not) (not |readily )?available/i
  ];
  
  // Check if response matches any of the "no info" patterns
  for (const pattern of noInfoPatterns) {
    if (pattern.test(response)) {
      return false;
    }
  }
  
  // Check if response is too short (likely generic)
  if (response.split(' ').length < 20) {
    return false;
  }
  
  return true;
}

/**
 * Run all test cases
 */
async function runTests() {
  console.log('Starting response quality tests...');
  let passedTests = 0;
  const results: any[] = [];
  
  for (let i = 0; i < testCases.length; i++) {
    const test = testCases[i];
    console.log(`\n----- Test ${i + 1}: "${test.query}" -----`);
    
    try {
      const agentResponse = await createAndProcessTask(test.query);
      const hasContent = hasActualContent(agentResponse);
      
      console.log(`Response length: ${agentResponse.length} characters`);
      console.log(`Contains actual content: ${hasContent ? 'YES' : 'NO'}`);
      
      if (hasContent) {
        console.log('Response snippet:', agentResponse.substring(0, 100) + '...');
        passedTests++;
        results.push({
          query: test.query,
          agentType: test.agentType,
          passed: true
        });
      } else {
        console.log('Test failed: Response lacks actual content');
        console.log('Full response:', agentResponse);
        results.push({
          query: test.query,
          agentType: test.agentType,
          passed: false
        });
      }
    } catch (error) {
      console.log(`Error in test ${i + 1}:`, error);
      results.push({
        query: test.query,
        agentType: test.agentType,
        passed: false,
        error: error
      });
    }
  }
  
  // Print summary
  console.log('\n=========================');
  console.log(`SUMMARY: ${passedTests}/${testCases.length} tests passed`);
  console.log('=========================');
  
  // Print results by agent type
  console.log('\nResults by agent type:');
  const agentTypes = [...new Set(testCases.map(t => t.agentType))];
  
  for (const agentType of agentTypes) {
    const agentResults = results.filter(r => r.agentType === agentType);
    const agentPassed = agentResults.filter(r => r.passed).length;
    console.log(`${agentType}: ${agentPassed}/${agentResults.length} passed`);
  }
}

// Run the tests
runTests().catch(console.error); 