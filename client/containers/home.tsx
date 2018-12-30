import * as React from 'react';
import { Link } from 'react-router-dom';

require('./home.scss');

export interface ScenarioInfo {
    title: string;
    link: string;
    description: string;
}
export interface Props {
    // scenarios: ScenarioInfo[];
}

export const Home = (props: Props) => {

    const title = 'Social AI';
    if (document.title !== title)
        document.title = title;

    const scenariosInfos: ScenarioInfo[] = [
        {
            title: 'Mnist',
            description: 'A large database of handwritten digits that is commonly used for training various image processing systems.',
            link: 'mnist'
        },
        {
            title: 'Go',
            description: 'An abstract strategy board game for two players, in which the aim is to surround more territory than the opponent. Coming soon!',
            link: 'go'
        },
        {
            title: 'Ant',
            description: 'A simulation of an ant colony. Model the brain of each individual ant like in serious games. Coming soon!',
            link: 'ant'
        },
        {
            title: 'Symbolic deduction',
            description: 'Finding the way to a symbolic deduction from the problem to the given target solution.',
            link: 'symbolic-deduction'
        }
    ];

    const scenarios = scenariosInfos.map((s, i) =>
        <li key={i}>
            <div>
                <Link to={`scenario/${s.link}`}>{s.title}</Link>
                <p>{s.description}</p>
            </div>
        </li>
    );

    return (
        <div className="home">
            <a className="github" href="https://github.com/lochbrunner/open-go-bot"><img src="https://s3.amazonaws.com/github/ribbons/forkme_right_gray_6d6d6d.png" alt="Fork me on GitHub" /></a>
            <section>
                <h1>Social AI</h1>
                <p>
                    <span>Create Deep-Learning models directly in your browser via drag and drop. </span>
                    <span>Share your model with others or jump into the challenge getting the best prediction results. </span>
                </p>
                <ul>
                    {scenarios}
                </ul>
            </section>
            <footer>
                <div>
                    <span>Site owner: Matthias Lochbrunner</span>
                    <span className="splitter" />
                    <span>Mail: <a href="">matthias_lochbrunner@web.de</a></span>
                    <span className="splitter" />
                    <span><a href="https://github.com/lochbrunner">Github</a></span>
                </div>
            </footer>
        </div>
    );
};