"use client";
import React from 'react';
import { Card, Descriptions, Typography } from 'antd'; // Using Ant Design for styling

const { Title, Text } = Typography;

interface OrderData {
  collection?: string;
  token: string;
  itemName: string;
  cost: number;
  timestamp: string | number;
}

const OrderView: React.FC<{ orderData: OrderData }> = ({ orderData }) => {
  // Format the timestamp for display
  const formatTimestamp = (timestamp: string | number) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch {
      return timestamp; // Return as-is if formatting fails, no need for `e`
    }
  };

  return (
    <Card 
      title={<Title level={4}>Order Details</Title>} 
      style={{ maxWidth: 600, margin: '20px auto' }}
    >
      <Descriptions bordered column={1}>
        <Descriptions.Item label="Collection">
          <Text strong>{orderData.collection || 'MAIN'}</Text>
        </Descriptions.Item>
        
        <Descriptions.Item label="Order Token">
          <Text code>{orderData.token}</Text>
        </Descriptions.Item>
        
        <Descriptions.Item label="Item Name">
          <Text>{orderData.itemName}</Text>
        </Descriptions.Item>
        
        <Descriptions.Item label="Cost">
          <Text type="success">${orderData.cost}</Text>
        </Descriptions.Item>
        
        <Descriptions.Item label="Order Date">
          <Text>{formatTimestamp(orderData.timestamp)}</Text>
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
};

export default OrderView;
