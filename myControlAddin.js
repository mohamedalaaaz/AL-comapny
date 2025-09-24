// myControlAddin.js
var myControlAddin = {
    initialize: function() {
        console.log("Control Add-in initialized.");
        // Add any initial setup here
    },
    showMessage: function(message) {
        alert(message);
    },
    // Example of a function that calls back to AL
    sendDataToAL: function(data) {
        Microsoft.Dynamics.NAV.InvokeExtensibilityMethod("DataReceivedFromJS", [data]);
    }
};


// MyControlAddin.al
controladdin MyControlAddin
{
    RequestedResources = 'myControlAddin.js'; // Reference your JavaScript file
    MinimumHeight = 200;
    MinimumWidth = 300;

    // AL events that can be triggered from JavaScript
    event DataReceivedFromJS(Data: Text);

    // AL functions that can be called from JavaScript
    procedure ShowMessageInJS(Message: Text);
}

// MyPage.al
page 50100 MyPage
{
    layout
    {
        area(content)
        {
            usercontrol(MyControlAddin; MyControlAddin)
            {
                ApplicationArea = All;

                trigger DataReceivedFromJS(Data: Text)
                begin
                    Message('Received from JavaScript: %1', Data);
                end;
            }
        }
    }

    actions
    {
        area(processing)
        {
            action(CallJSFunction)
            {
                ApplicationArea = All;
                trigger OnAction()
                begin
                    MyControlAddin.ShowMessageInJS('Hello from AL!');
                end;
            }
        }
    }
}
