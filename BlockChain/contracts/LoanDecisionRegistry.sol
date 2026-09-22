// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract LoanDecisionRegistry {

    struct LoanDecision {
        uint256 loanId;
        string decision;
        uint256 timestamp;
        bool exists;
    }
    enum LoanStatus {
        Pending,
        Approved,
        Rejected
    }

    struct LoanApplication {
        uint256 applicationId;
        address applicant;
        uint256 loanAmount;
        LoanStatus status;
        uint256 appliedAt;
        bool exists;
    }

    uint256 private applicationCounter;
    address public decisionMaker;

    mapping(uint256 => LoanDecision) private loanDecisions;
    mapping(uint256 => LoanApplication) private loanApplications;
    mapping(address => uint256[]) private applicantApplications;

    event LoanDecisionRecorded(
        uint256 indexed loanId,
        string decision,
        uint256 timestamp
    );
    
    event LoanApplicationSubmitted(
        uint256 indexed applicationId,
        address indexed applicant,
        uint256 loanAmount,
        uint256 timestamp
    );

    event LoanApplicationStatusUpdated(
        uint256 indexed applicationId,
        LoanStatus status,
        uint256 timestamp
    );
    constructor() {
        decisionMaker = msg.sender;
    }

    function registerLoanApplication(
        uint256 _loanAmount
    ) public returns (uint256) {
        require(_loanAmount > 0, "Invalid loan amount");
       
        applicationCounter++;
        
        loanApplications[applicationCounter] = LoanApplication({
            applicationId: applicationCounter,
            applicant: msg.sender,
            loanAmount: _loanAmount,
            status: LoanStatus.Pending,
            appliedAt: block.timestamp,
            exists: true
        });
        applicantApplications[msg.sender].push(applicationCounter);

        emit LoanApplicationSubmitted(
            applicationCounter,
            msg.sender,
            _loanAmount,
            block.timestamp
        );
        return applicationCounter;
    }

    function getApplicationCounter() public view returns (uint256) {
        return applicationCounter;
    }
    function getApplicantApplications( address _applicant
    ) public view returns (uint256[] memory) {
        require(
            _applicant != address(0),
            "Invalid applicant address"
        );
        return applicantApplications[_applicant];
    }

    function getLoanApplication(
        uint256 _applicationId
    ) 
        public
        view
        returns (
            uint256,
            address,
            uint256,
            LoanStatus,
            uint256
        )
    {
    
        require(
            loanApplications[_applicationId].exists,
            "Loan application not found"
        );
        LoanApplication memory application = loanApplications[_applicationId];
        
        return (
            application.applicationId,
            application.applicant,
            application.loanAmount,
            application.status,
            application.appliedAt
        );
    }
    function getLoanApplicationStatus(
        uint256 _applicationId
    ) public view returns (LoanStatus) {
            require(
                loanApplications[_applicationId].exists,
                "Loan application not found" 
            );
            return loanApplications[_applicationId].status;
    }
    function getMyLoanApplication(uint256
     _applicationId)
         public
         view
         returns (
            uint256,
            address,
            uint256,
            LoanStatus,
            uint256
        )
    {
        require(
            loanApplications[_applicationId].exists,
            "Loan application not found"
        );

        require(
            loanApplications[_applicationId].applicant == msg.sender,
            "Not the application owner"
        );

        LoanApplication memory application = loanApplications[_applicationId];
        
        return (
            application.applicationId,
            application.applicant,
            application.loanAmount,
            application.status,
            application.appliedAt
        );
    }

    function recordLoanDecision(
    uint256 _loanId,
    string memory _decision
) public {
    require(
        msg.sender == decisionMaker,
        "Not authorized to record decision"
    );
    require(_loanId > 0, "Invalid loan ID");

    require(
        loanApplications[_loanId].exists,
        "Loan application not found"
    );

    require(
        !loanDecisions[_loanId].exists,
        "Loan decision already recorded"
    );
    require(
        loanApplications[_loanId].status == LoanStatus.Pending,
        "Loan application is not pending"
    );

    bytes32 decisionHash = keccak256(bytes(_decision));

    if (decisionHash == keccak256(bytes("Approved"))) {
        loanApplications[_loanId].status = LoanStatus.Approved;
    } else if (decisionHash == keccak256(bytes("Rejected"))) {
        loanApplications[_loanId].status = LoanStatus.Rejected;
    } else {
        revert("Invalid loan decision");
    }

    emit LoanApplicationStatusUpdated(
        _loanId,
        loanApplications[_loanId].status,
        block.timestamp
    );

    loanDecisions[_loanId] = LoanDecision({
        loanId: _loanId,
        decision: _decision,
        timestamp: block.timestamp,
        exists: true
    });

    emit LoanDecisionRecorded(
        _loanId,
        _decision,
        block.timestamp
    );
}

    function getLoanDecision(
        uint256 _loanId
    ) public view returns (
        uint256,
        string memory,
        uint256
    ) {
        require(
            loanDecisions[_loanId].exists,
            "Loan decision not found"
        );

        LoanDecision memory loan = loanDecisions[_loanId];

        return (
            loan.loanId,
            loan.decision,
            loan.timestamp
        );
    }
}