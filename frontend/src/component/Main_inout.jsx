import React from 'react';
import "../style/mainpage.css";

const data = [
  { id: 1, number: "12가3456", area: "일반", in: "20:46", out: "-", action: "입차" },
  { id: 2, number: "34나5678", area: "일반", in: "-", out: "18:46", action: "출차" },
  { id: 3, number: "89다0123", area: "일반", in: "12:46", out: "-", action: "보기" },
];

const Main_inout = () => {
  return (
    <div className='inout box-style'>
      <div className="header">
        <h3>입·출차 기록</h3>
        <button className="all-btn">전체 보기</button>
      </div>
      <table className="data-table">
        <colgroup>
          <col style={{width: "25%"}} />
          <col style={{width: "20%"}} />
          <col style={{width: "20%"}} />
          <col style={{width: "20%"}} />
          <col style={{width: "15%"}} />
        </colgroup>
        <thead>
          <tr>
            <th>차량번호</th>
            <th>구역</th>
            <th>입차</th>
            <th>출차</th>
            <th>작업</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.id}>
              <td>{row.number}</td>
              <td>{row.area}</td>
              <td>{row.in}</td>
              <td>{row.out}</td>
              <td>
                <button className="action-btn">{row.action}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Main_inout;
