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

    function recordLoanDecision(
        uint256 _loanId,
        string memory _decision
    ) public {
        require(_loanId > 0, "Invalid loan ID");
        require(
            !loanDecisions[_loanId].exists,
            "Loan decision already recorded"
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