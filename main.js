/**
 * 
 * 
 * @param {*} targetProgram 
 * @returns 
 */
function extractSQL(targetProgram) {

  //返却用オブジェクト初期化
  let result = {};
  //入力されたプログラムを大文字に変換
  targetProgram = targetProgram.toUpperCase();
  //改行コードの統一
  targetProgram = targetProgram.replaceAll("\r\n", "\r").replaceAll("\n", "\r");

  let WK_list = [];
  //プログラム中にSELECTが含まれていたら
  if (targetProgram.indexOf('SELECT') != -1) {
    WK_list.push(extractDbNameOfSelect(targetProgram));
  }

  //プログラム中にINSERTが含まれていたら
  if (targetProgram.indexOf('INSERT') != -1) {
    WK_list.push(extractDbNameOfInsert(targetProgram));
  }

  //プログラム中にUPDATEが含まれていたら
  if (targetProgram.indexOf('UPDATE ') != -1) {
    WK_list.push(extractDbNameOfUpdate(targetProgram));
  }

  //プログラム中にUPDATEが含まれていたら
  if (targetProgram.indexOf('DELETE') != -1) {
    WK_list.push(extractDbNameOfDelete(targetProgram));
  }

  //この時点で配列WK_listは
  // [
  //   {DBName: "S", ... },
  //   {DBName: "I", ... },
  //   {DBName: "U", ... },
  //   {DBName: "D", ... }
  // ]
  // の状態にある

  //↑配列を{DBName: "S,I,U,D", ... }の形に変換する
  result = margeSqlList(WK_list);

  return result
}

/**
 * プログラム中からSELECTのDB名を抜き出す
 * 
 * @param {*} targetProgram 
 * @returns result : 結果オブジェクト {DBName: "S", ... }
 */
function extractDbNameOfSelect(targetProgram) {

  let result = {};
  const valueOfCrud =  "S";
  //SELECTがなくなるまで処理を繰り返し
  while (targetProgram.indexOf('SELECT') != -1) {
    //SELECTが含まれる位置から最後まで切り取り
    targetProgram = targetProgram.substr(targetProgram.indexOf('SELECT'), targetProgram.length);
    //切り取った文字列からさらにFromの位置から30文字を切り取り前後の空白トリム、空白でスプリットしたもの初めのものを取得
    let tableName = targetProgram.substr(targetProgram.indexOf('FROM') + 5, 30).trim().split(' ')[0].split('\r')[0];
    //オブジェクトにDB名:S を登録
    result[tableName] = valueOfCrud;
    //SQL部を切り取り
    if (targetProgram.indexOf('CFQUERY') != -1) {
      //coldfusion
      var wk_msg = targetProgram.substr(targetProgram.indexOf('FROM'), targetProgram.indexOf('CFQUERY'))
    } else {
      //Java
      var wk_msg = targetProgram.substr(targetProgram.indexOf('FROM'), targetProgram.indexOf(';'))
    }
    //Joinが含まれていた場合JoinされたDBを抽出
    if (wk_msg.indexOf('JOIN') != -1) {
      while (wk_msg.indexOf('JOIN') != -1) {
        let wk_tableName = wk_msg.substr(wk_msg.indexOf('JOIN') + 5, 30).trim().split(' ')[0].split('\r')[0];
        result[wk_tableName] = valueOfCrud;
        wk_msg = wk_msg.substr(wk_msg.indexOf('JOIN')  + 5 + wk_tableName.length, wk_msg.length);
      }
    //Joinが含まれていない場合はFrom + DBName を切り取り、再処理
    } else {
      targetProgram = targetProgram.substr(targetProgram.indexOf('FROM') + tableName.length + 1, targetProgram.length);
    }
  }
  return result;

}


/**
* プログラム中からINSERTのDB名を抜き出す
* 
* @param {*} targetProgram 
* @returns result : 結果オブジェクト {DBName: "I", ... }
*/
function extractDbNameOfInsert(targetProgram) {
  let result = {};
  const valueOfCrud =  "I";
  while (targetProgram.indexOf('INSERT') != -1) {
    targetProgram = targetProgram.substr(targetProgram.indexOf('INSERT'), targetProgram.length);
    let tableName = targetProgram.substr(targetProgram.indexOf('INTO') + 5, 30).trim().split(' ')[0].split('\r')[0];
    result[tableName] = valueOfCrud;
    targetProgram = targetProgram.substr(targetProgram.indexOf('INTO') + 5 + tableName.length, targetProgram.length);
  }
  return result;
}


/**
* プログラム中からUPDATEのDB名を抜き出す
* 
* @param {*} targetProgram 
* @returns result : 結果オブジェクト {DBName: "U", ... }
*/
function extractDbNameOfUpdate(targetProgram) {
  let result = {};
  const valueOfCrud =  "U";
  while (targetProgram.indexOf('UPDATE') != -1) {
    targetProgram = targetProgram.substr(targetProgram.indexOf('UPDATE'), targetProgram.length);
    let tableName = targetProgram.substr(targetProgram.indexOf('UPDATE') + 7, 30).trim().split(' ')[0].split('\r')[0];
    result[tableName] = valueOfCrud;
    targetProgram = targetProgram.substr(7 + tableName.length, targetProgram.length);
  }
  return result;
}


/**
* プログラム中からDELETEのDB名を抜き出す
* 
* @param {*} targetProgram 
* @returns result : 結果オブジェクト {DBName: "D", ... }
*/
function extractDbNameOfDelete(targetProgram) {
  let result = {};
  const valueOfCrud =  "D";
  while (targetProgram.indexOf('DELETE') != -1) {
    targetProgram = targetProgram.substr(targetProgram.indexOf('DELETE'), targetProgram.length);
    let tableName = targetProgram.substr(targetProgram.indexOf('FROM') + 5, 30).trim().split(' ')[0].split('\r')[0];
    result[tableName] = valueOfCrud;
    targetProgram = targetProgram.substr(targetProgram.indexOf('FROM') + 5 + tableName.length, targetProgram.length);
  }
  return result;
}


/**
* 下記の状態の配列をマージし一つにする
*  [
*   {DBName: "S", ... },
*   {DBName: "I", ... },
*   {DBName: "U", ... },
*   {DBName: "D", ... }
*  ]
*  -> {DBName: "S,I,U,D", ... }
* 
* @param {*} targetList
* @returns result : 結果配列 {DBName: "D", ... }
*/
function margeSqlList(targetList){
  console.log(targetList)
  let resultObj = {};
  for(const wk_Object of targetList){
    for(const tableName in wk_Object){
      if(tableName in resultObj){
        resultObj[tableName] = resultObj[tableName] + "," + wk_Object[tableName];
      } else {
        resultObj[tableName] = wk_Object[tableName];
      }
    }
  }
  return resultObj
}


/**
* 下記の状態のオブジェクトをテーブル表示用配列に変換
*
* {DBName: "S,I,U,D", ... }
* -> {}
* 
* @param {*} targetObject
* @returns result : 結果配列 {DBName: "D", ... }
*/
function ObjectToListForDisplayTable(targetObject){
  let resultList = [];
  for(const tableName in targetObject){
    let wk_obj = {};
    wk_obj.tableName = tableName;
    wk_obj.CRUD = targetObject[tableName];
    resultList.push(wk_obj);
  }
  return resultList
}