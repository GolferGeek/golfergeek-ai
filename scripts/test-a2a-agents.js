#!/usr/bin/env node

/**
 * Test script for A2A agents
 * Executes a series of curl commands to test the A2A infrastructure
 */

const { execSync } = require('child_process');
const { v4: uuidv4 } = require('uuid');

// Base URL for the API
const BASE_URL = 'http://localhost:3333/api';

// Helper function to execute a command and log its output
function runCommand(command) {
  console.log(`\n> ${command}\n`);
  try {
    const output = execSync(command, { encoding: 'utf-8' });
    console.log(output);
    return output;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    console.error(error.stdout);
    return null;
  }
}

// Helper function to create a JSON-RPC request
function createJsonRpcRequest(method, params) {
  return JSON.stringify({
    jsonrpc: '2.0',
    id: uuidv4(),
    method,
    params
  });
}

// Helper function to test an agent
function testAgent(agentPath, question) {
  console.log(`\n========== Testing ${agentPath} ==========\n`);
  
  // Check if the agent is accessible
  runCommand(`curl -s ${BASE_URL}/${agentPath}`);
  
  // Get the agent card
  runCommand(`curl -s ${BASE_URL}/${agentPath}/.well-known/agent.json | jq .`);
  
  // Send a task to the agent
  const taskId = uuidv4();
  const taskParams = {
    id: taskId,
    message: {
      role: 'user',
      parts: [{ type: 'text', text: question }]
    }
  };
  
  const request = createJsonRpcRequest('tasks/send', taskParams);
  runCommand(`curl -s -X POST ${BASE_URL}/${agentPath} -H "Content-Type: application/json" -d '${request}' | jq .`);
  
  return taskId;
}

// Helper function to test the orchestrator
function testOrchestrator(question) {
  console.log(`\n========== Testing Orchestrator ==========\n`);
  
  // Check if the orchestrator is accessible
  runCommand(`curl -s ${BASE_URL}/agents/a2a/orchestrator`);
  
  // Get the orchestrator card
  runCommand(`curl -s ${BASE_URL}/agents/a2a/orchestrator/.well-known/agent.json | jq .`);
  
  // List available agents
  runCommand(`curl -s ${BASE_URL}/agents/a2a/orchestrator/agents | jq .`);
  
  // Send a task to the orchestrator
  const taskId = uuidv4();
  const taskParams = {
    id: taskId,
    message: {
      role: 'user',
      parts: [{ type: 'text', text: question }]
    }
  };
  
  const request = createJsonRpcRequest('tasks/send', taskParams);
  runCommand(`curl -s -X POST ${BASE_URL}/agents/a2a/orchestrator -H "Content-Type: application/json" -d '${request}' | jq .`);
  
  return taskId;
}

// Main test function
async function runTests() {
  console.log('Starting A2A agent tests...\n');
  
  // Test Vue Core agent
  testAgent('agents/a2a/vue-core', 'How do Vue components work?');
  
  // Test Vuex agent
  testAgent('agents/a2a/vuex', 'How do I use Vuex for state management?');
  
  // Test orchestrator with a Vue Core question
  testOrchestrator('Explain Vue component lifecycle hooks');
  
  // Test orchestrator with a Vuex question
  testOrchestrator('How do I implement Vuex actions?');
  
  // Test orchestrator's list agents command
  testOrchestrator('list agents');
  
  console.log('\nA2A agent tests completed!');
}

// Run the tests
runTests().catch(error => {
  console.error('Error running tests:', error);
  process.exit(1);
}); 