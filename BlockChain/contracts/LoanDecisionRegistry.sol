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



    event LoanDecisionRecorded(
        uint256 indexed loanId,
        string decision,
        uint256 timestamp
    );
    

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