// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract RouteGuard {
    uint256 public nextAssessmentId = 1;

    struct Assessment {
        uint256 id;
        string routeName;
        uint8 riskScore;
        bool approved;
        string reportHash;
        address assessor;
        uint256 timestamp;
    }

    mapping(uint256 => Assessment) public assessments;

    event AssessmentRecorded(
        uint256 indexed id,
        string routeName,
        uint8 riskScore,
        bool approved,
        address indexed assessor
    );

    function recordAssessment(
        string calldata routeName,
        uint8 riskScore,
        bool approved,
        string calldata reportHash
    ) external returns (uint256 id) {
        require(bytes(routeName).length > 0, "Route name required");
        require(riskScore <= 100, "Risk score must be 0-100");
        require(bytes(reportHash).length > 0, "Report hash required");

        id = nextAssessmentId++;

        assessments[id] = Assessment({
            id: id,
            routeName: routeName,
            riskScore: riskScore,
            approved: approved,
            reportHash: reportHash,
            assessor: msg.sender,
            timestamp: block.timestamp
        });

        emit AssessmentRecorded(
            id,
            routeName,
            riskScore,
            approved,
            msg.sender
        );
    }
}
