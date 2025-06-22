#!/bin/bash

# Test Menu System
# Interactive menu for running different test suites

echo "🧪 FIRST WATCH PLC CODE CHECKER - TEST MENU"
echo "============================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

show_menu() {
    echo -e "${CYAN}Available Test Suites:${NC}"
    echo ""
    echo "1. Quick Test (⚡ Fast essential checks)"
    echo "2. Frontend Tests (🎨 React components & UI)"
    echo "3. Backend Tests (🔧 Python modules & database)"
    echo "4. Integration Tests (🔗 End-to-end workflows)"
    echo "5. All Tests (🚀 Complete comprehensive suite)"
    echo "6. Handler Tests (🔧 All system handlers validation)"
    echo ""
    echo "7. Individual Test Scripts:"
    echo "   • Save Analysis (./test-save-analysis.sh)"
    echo "   • Git Functionality (./test-git-functionality.sh)"
    echo "   • Comparison Fix (./test-comparison-fix.sh)"
    echo "   • Delete Button (./test-delete-button.sh)"
    echo "   • OT Threat Intel (./test-ot-threat-intel-fix.sh)"
    echo ""
    echo "0. Exit"
    echo ""
}

run_individual_tests() {
    echo -e "${YELLOW}Individual Test Scripts:${NC}"
    echo ""
    echo "a. Save Analysis Test"
    echo "b. Git Functionality Test"
    echo "c. Comparison Test"
    echo "d. Delete Button Test"
    echo "e. OT Threat Intel Test"
    echo "f. Handler Tests"
    echo "g. Back to main menu"
    echo ""
    echo -n "Select test (a-g): "
    read -r choice
    
    case $choice in
        a) 
            echo "Running Save Analysis Test..."
            ./test-save-analysis.sh
            ;;
        b) 
            echo "Running Git Functionality Test..."
            ./test-git-functionality.sh
            ;;
        c) 
            echo "Running Comparison Test..."
            ./test-comparison-fix.sh
            ;;
        d) 
            echo "Running Delete Button Test..."
            ./test-delete-button.sh
            ;;
        e) 
            echo "Running OT Threat Intel Test..."
            ./test-ot-threat-intel-fix.sh
            ;;
        f) 
            echo "Running Handler Tests..."
            ./test-all-handlers.sh
            ;;
        g) 
            return
            ;;
        *) 
            echo "Invalid selection"
            ;;
    esac
    
    echo ""
    echo "Press Enter to continue..."
    read -r
}

make_executable() {
    chmod +x run-all-tests.sh
    chmod +x quick-test.sh
    chmod +x test-frontend.sh
    chmod +x test-backend.sh
    chmod +x test-integration.sh
    chmod +x test-save-analysis.sh
    chmod +x test-git-functionality.sh
    chmod +x test-comparison-fix.sh
    chmod +x test-delete-button.sh
    chmod +x test-ot-threat-intel-fix.sh
    chmod +x test-all-handlers.sh
}

# Make all test scripts executable
make_executable

while true; do
    clear
    echo "🧪 FIRST WATCH PLC CODE CHECKER - TEST MENU"
    echo "============================================"
    echo ""
    
    show_menu
    echo -n "Select option (0-7): "
    read -r choice
    
    case $choice in
        1)
            echo ""
            echo -e "${GREEN}Running Quick Tests...${NC}"
            echo ""
            ./quick-test.sh
            ;;
        2)
            echo ""
            echo -e "${GREEN}Running Frontend Tests...${NC}"
            echo ""
            ./test-frontend.sh
            ;;
        3)
            echo ""
            echo -e "${GREEN}Running Backend Tests...${NC}"
            echo ""
            ./test-backend.sh
            ;;
        4)
            echo ""
            echo -e "${GREEN}Running Integration Tests...${NC}"
            echo ""
            ./test-integration.sh
            ;;
        5)
            echo ""
            echo -e "${GREEN}Running All Tests...${NC}"
            echo ""
            ./run-all-tests.sh
            ;;
        6)
            echo ""
            echo -e "${GREEN}Running Handler Tests...${NC}"
            echo ""
            ./test-all-handlers.sh
            ;;
        7)
            run_individual_tests
            continue
            ;;
        0)
            echo ""
            echo -e "${GREEN}Goodbye!${NC}"
            exit 0
            ;;
        *)
            echo ""
            echo -e "${RED}Invalid selection. Please choose 0-7.${NC}"
            ;;
    esac
    
    echo ""
    echo "Press Enter to return to menu..."
    read -r
done
