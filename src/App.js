import { useEffect, useState } from 'react';
import protobuf from 'protobufjs';
const { Buffer } = require('buffer/');

const emojis = {
  '': '',
  'up': '🚀',
  'down': '💩',
}

function formatPrice(price) {
  return `$${price.toFixed(2)}`;
}

function App() {
  const [stonks, setStonks] = useState([]);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ws = new WebSocket('wss://streamer.finance.yahoo.com');
    protobuf.load('./YPricingData.proto', (error, root) => {
      if (error) {
        return console.log(error);
      }
      const Yaticker = root.lookupType('yaticker');

      ws.onopen = function open() {
        console.log('connected');
        ws.send(
          JSON.stringify({
            subscribe: (params.get('symbols') || 'GME')
              .split(',')
              .map((symbol) => symbol.toUpperCase()),
          })
        );
      };

      ws.onclose = function close() {
        console.log('disconnected');
      };

      ws.onmessage = function incoming(message) {
        const next = Yaticker.decode(new Buffer(message.data, 'base64'));
        setStonks((current) => {
          let stonk = current.find((stonk) => stonk.id === next.id);
          if (stonk) {
            return current.map((stonk) => {
              if (stonk.id === next.id) {
                return {
                  ...next,
                  direction:
                    stonk.price < next.price
                      ? 'up'
                      : stonk.price > next.price
                        ? 'down'
                        : stonk.direction,
                };
              }
              return stonk;
            });
          } else {
            return [
              ...current,
              {
                ...next,
                direction: '',
              },
            ];
          }
        });
      };
    });
  }, []);

  return (
    <div className='main'>
      <h3>Loading Updates:</h3>
      <div className="stonks">
        
        {stonks.map((stonk) => (
          <div className="stonk" key={stonk.id}>
            <h2 className={stonk.direction}>
              {stonk.id} {formatPrice(stonk.price)} {emojis[stonk.direction]}
            </h2>
          </div>
        ))}
      </div>
    </div>

  );
}

export default App;
