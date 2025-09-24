#include <iostream>
#include <string>

// Function to simulate a simple AI decision
std::string makeSimpleDecision(int input_value) {
    if (input_value > 10) {
        return "High value detected: Recommend action A.";
    } else if (input_value > 5) {
        return "Medium value detected: Recommend action B.";
    } else {
        return "Low value detected: Recommend action C.";
    }
}

int main() {
    int sensor_reading;

    std::cout << "Enter a sensor reading (integer): ";
    std::cin >> sensor_reading;

    // Get the AI's decision based on the input
    std::string decision = makeSimpleDecision(sensor_reading);

    std::cout << "AI Decision: " << decision << std::endl;

    return 0;
}


