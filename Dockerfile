FROM node:alpine

COPY /quiz/* /quiz/

VOLUME /quiz

WORKDIR /app

COPY app/* ./
COPY app/templates/* ./templates/

RUN ["npm", "install"]
ENTRYPOINT [ "node", "." ]

CMD ["echo", "server running at http://localhost:3000/quiz-list"]

EXPOSE 3000