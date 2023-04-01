const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
let db = null;
const path = require("path");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
app.use(express.json());
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server is running at https//localhost:3000");
    });
  } catch (e) {
    console.log(`DBError:${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();
// api 1 list of all the players in the player table
app.get(`/players/`, async (request, response) => {
  //const input = request.body;
  const allGetQuery = `select player_id as playerId, player_name as playerName from player_details;`;
  const dbResponse = await db.all(allGetQuery);
  response.send(dbResponse);
});

//api 2 Returns a specific player based on the player ID
app.get(`/players/:playerId/`, async (request, response) => {
  //const input = request.body;
  const { playerId } = request.params;
  const playerGetByIdQuery = `select player_id as playerId,player_name as playerName from player_details where player_id=${playerId};`;
  const dbResponse = await db.get(playerGetByIdQuery);
  response.send(dbResponse);
});
//api 3 Updates the details of a specific player based on the player ID
app.put(`/players/:playerId/`, async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  console.log(request.body);
  console.log(playerId);

  const query = `UPDATE player_details
                    SET
                    player_name='${playerName}'
                    WHERE player_id=${playerId};`;
  const dbResponse = await db.run(query);
  response.send(`Player Details Updated`);
});
//api 4 Returns the match details of a specific match
app.get(`/matches/:matchId/`, async (request, response) => {
  const { matchId } = request.params;
  const matchDetailsQuery = `select match_id as matchId,match,year from match_details where match_id=${matchId};`;
  const dbResponse = await db.get(matchDetailsQuery);
  response.send(dbResponse);
});

// api 5 Returns a list of all the matches of a player
app.get(`/players/:playerId/matches`, async (request, response) => {
  const { playerId } = request.params;
  const getAllMatchesByPlayerQuery = `SELECT 
                                                match_details.match_id as matchId,
                                                match_details.match as match,
                                                match_details.year as year 
                                         FROM 
                                            match_details inner join player_match_score 
                                            on match_details.match_id = player_match_score.match_id
                                         WHERE player_id=${playerId};`;
  const dbResponse = await db.all(getAllMatchesByPlayerQuery);
  response.send(dbResponse);
});
//api 6 Returns a list of players of a specific match
app.get(`/matches/:matchId/players`, async (request, response) => {
  const { matchId } = request.params;
  const getAllPlayersByMatchQuery = `SELECT
                                                player_details.player_id as playerId,
                                                player_details.player_name as playerName
                                            FROM
                                            player_details inner join player_match_score
                                            on player_details.player_id=player_match_score.player_id
                                            where match_id=${matchId};`;
  const dbResponse = await db.all(getAllPlayersByMatchQuery);
  response.send(dbResponse);
});

//api 7 Returns the statistics of the total score, fours, sixes of a specific player based on the player ID
app.get(`/players/:playerId/playerScores`, async (request, response) => {
  const { playerId } = request.params;
  const totalQuery = `SELECT 
    pd.player_id as playerId, 
    pd.player_name as playerName, 
    SUM(pms.score) AS totalScore, 
    SUM(pms.fours) AS totalFours, 
    SUM(pms.sixes) AS totalSixes 
FROM 
    player_details pd 
    INNER JOIN player_match_score pms ON pd.player_id = pms.player_id 
WHERE 
    pd.player_id = ${playerId} 
GROUP BY 
    pd.player_id;`;
  const dbResponse = await db.get(totalQuery);
  response.send(dbResponse);
});
module.exports = app;
