import React from 'react';
import "../style/mainpage.css";

const data = [
  { id: 1, number: "12가3456", area: "장애인", reason: "불법주차", time: "22:46", status: "대기", action: "전환" },
  { id: 2, number: "34나5678", area: "장애인", reason: "불법주차", time: "18:46", status: "처리중", action: "전송" },
  { id: 3, number: "89다0123", area: "장애인", reason: "주차방해", time: "12:46", status: "확인", action: "보기" },
];

const Mainpage_vio = () => {
  return (
    <div className='vio box-style'>
      <div className="header">
        <h3>최근 위반</h3>
        <button className="all-btn">전체 보기</button>
      </div>
      <table className="data-table">
        <colgroup>
          <col style={{width: "25%"}} />
          <col style={{width: "15%"}} />
          <col style={{width: "20%"}} />
          <col style={{width: "15%"}} />
          <col style={{width: "15%"}} />
          <col style={{width: "10%"}} />
        </colgroup>
        <thead>
          <tr>
            <th>차량번호</th>
            <th>구역</th>
            <th>사유</th>
            <th>시각</th>
            <th>상태</th>
            <th>작업</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.id}>
              <td>{row.number}</td>
              <td>{row.area}</td>
              <td>{row.reason}</td>
              <td>{row.time}</td>
              <td>
                <span className={`status ${row.status}`}>{row.status}</span>
              </td>
              <td>
                <button className="action-btn">보기</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Mainpage_vio;