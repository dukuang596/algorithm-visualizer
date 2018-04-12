import React from 'react';
import { Renderer } from '/core/renderers';
import { classes, distance } from '/common/util';
import styles from './stylesheet.scss';

class GraphRenderer extends Renderer {
  constructor(props) {
    super(props);

    this.element = React.createRef();
    this.selectedNode = null;
  }

  handleMouseDown(e) {
    super.handleMouseDown(e);
    const coords = this.computeCoords(e);
    const { graph, dimensions } = this.props.data;
    const { nodeRadius } = dimensions;
    this.selectedNode = graph.nodes.find(node => distance(coords, node) <= nodeRadius);
  }

  handleMouseMove(e) {
    if (this.selectedNode) {
      const coords = this.computeCoords(e);
      this.props.data.updateNode(this.selectedNode.id, coords);
    } else {
      super.handleMouseMove(e);
    }
  }

  computeCoords(e) {
    const svg = this.element.current;
    const s = svg.createSVGPoint();
    s.x = e.clientX;
    s.y = e.clientY;
    const { x, y } = s.matrixTransform(svg.getScreenCTM().inverse());
    return { x, y };
  }

  renderData() {
    const { graph, options, dimensions } = this.props.data;
    const { baseWidth, baseHeight, nodeRadius, arrowGap, nodeWeightGap, edgeWeightGap } = dimensions;
    const { directed, weighted } = options;
    const viewBox = [
      (this.centerX - baseWidth / 2) * this.zoom,
      (this.centerY - baseHeight / 2) * this.zoom,
      baseWidth * this.zoom,
      baseHeight * this.zoom,
    ];
    return (
      <svg className={styles.graph} viewBox={viewBox} ref={this.element}>
        <defs>
          <marker id="markerArrow" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto">
            <path d="M0,0 L0,4 L4,2 L0,0" className={styles.arrow} />
          </marker>
          <marker id="markerArrowVisited" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto">
            <path d="M0,0 L0,4 L4,2 L0,0" className={classes(styles.arrow, styles.visited)} />
          </marker>
        </defs>
        {
          graph.edges.sort((a, b) => a.visited - b.visited).map(edge => {
            const { source, target, weight, visited } = edge;
            const { x: sx, y: sy } = graph.findNode(source);
            let { x: ex, y: ey } = graph.findNode(target);
            const mx = (sx + ex) / 2;
            const my = (sy + ey) / 2;
            const dx = ex - sx;
            const dy = ey - sy;
            const degree = Math.atan2(dy, dx) / Math.PI * 180;
            if (directed) {
              const length = Math.sqrt(dx * dx + dy * dy);
              if (length !== 0) {
                ex = sx + dx / length * (length - nodeRadius - arrowGap);
                ey = sy + dy / length * (length - nodeRadius - arrowGap);
              }
            }

            return (
              <g className={classes(styles.edge, visited && styles.visited)} key={`${source}-${target}`}>
                <path d={`M${sx},${sy} L${ex},${ey}`} className={classes(styles.line, directed && styles.directed)} />
                {
                  weighted &&
                  <g transform={`translate(${mx},${my})`}>
                    <text className={styles.weight} transform={`rotate(${degree})`} y={-edgeWeightGap}>{weight}</text>
                  </g>
                }
              </g>
            );
          })
        }
        {
          graph.nodes.map(node => {
            const { id, x, y, weight, visited } = node;
            return (
              <g className={classes(styles.node, visited && styles.visited)} key={id}
                 transform={`translate(${x},${y})`}>
                <circle className={styles.circle} r={nodeRadius} />
                <text className={styles.id}>{id}</text>
                {
                  weighted &&
                  <text className={styles.weight} x={nodeRadius + nodeWeightGap}>{weight}</text>
                }
              </g>
            );
          })
        }
      </svg>
    );
  }
}

export default GraphRenderer;
